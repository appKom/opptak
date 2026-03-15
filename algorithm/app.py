from pymongo import MongoClient
from pymongo.database import Database
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
import os
import certifi
from typing import List, Dict
from flask import Flask, request, jsonify

from mip_matching.Committee import Committee
from mip_matching.TimeInterval import TimeInterval
from mip_matching.Applicant import Applicant
from mip_matching.match_meetings import match_meetings, MeetingMatch

app = Flask(__name__)

API_SECRET = os.environ.get("INTERNAL_API_SECRET")


@app.route("/")  # type: ignore
def main():
    incoming_secret = request.headers.get("X-Internal-Secret")

    database_name = request.headers.get("Database-Name")

    match database_name:
        case "development":
            mongo_uri = os.getenv("MONGODB_URI_DEV")
        case "production":
            mongo_uri = os.getenv("MONGODB_URI_PROD")
        case _:
            return jsonify({"error": "Given Database-Name not allowed"}), 400

    if not mongo_uri:
        return jsonify({"error": "Environment variable not set"}), 500

    if incoming_secret != API_SECRET:
        return jsonify({"error": "Unauthorized"}), 401

    print("Starting matching")
    period_id = request.args.get("period")
    if not period_id:
        return jsonify({"error": "Period not provided"}), 400

    push_to_db = request.args.get("pushToDB", "false").lower() == "true"

    applicants = fetch_applicants(period_id,
                                  mongo_uri=mongo_uri,
                                  database_name=database_name)
    committee_times = fetch_committee_times(period_id,
                                            mongo_uri=mongo_uri,
                                            database_name=database_name)

    committee_objects = create_committee_objects(committee_times)

    all_committees = {
        committee.name: committee for committee in committee_objects}

    applicant_objects = create_applicant_objects(
        applicants, all_committees)

    match_result = match_meetings(applicant_objects, committee_objects)
    print(
        f"Matching finished with status {match_result["solver_status"]}")
    print(
        f"Matched {match_result["matched_meetings"]}/{match_result["total_wanted_meetings"]} ({match_result["matched_meetings"]/match_result["total_wanted_meetings"]:.2f}) meetings")

    if push_to_db:
        send_to_db(match_result, applicants, period_id,
                   mongo_uri=mongo_uri, database_name=database_name)
        print("Meetings sent to database")

    result = {
        "status": str(match_result["solver_status"]),
        "total_wanted_meetings": match_result["total_wanted_meetings"],
        "matched_meetings": match_result["matched_meetings"],
        "results": format_match_results(match_result, applicants, period_id)
    }
    return result


def add_matching_status(
    period_id: str,
    match_result: MeetingMatch,
    mongo_database: Database,
):
    """
    Updates the database with mathing status added to the period.
    """
    period_collection = mongo_database["periods"]

    # Removes actual results from meeting match
    matching_status = {key: value for key,
                       value in match_result.items() if key != "results"}

    period_collection.find_one_and_update({"_id": period_id}, {"$set": {
        "matching_status": matching_status
    }})


def send_to_db(match_result: MeetingMatch,
               applicants: List[dict],
               period_id: str,
               mongo_uri: str,
               database_name: str):
    load_dotenv()
    formatted_results = format_match_results(
        match_result, applicants, period_id)
    print("Sending to db")
    print(formatted_results)

    client = MongoClient(mongo_uri, tlsCAFile=certifi.where())

    db = client[database_name]  # type: ignore

    collection = db["interviews"]

    collection.insert_many(formatted_results)

    add_matching_status(period_id=period_id,
                        match_result=match_result,
                        mongo_database=db)

    client.close()


def connect_to_db(collection_name,
                  mongo_uri: str,
                  database_name: str):
    load_dotenv()

    client = MongoClient(mongo_uri, tlsCAFile=certifi.where())

    db = client[database_name]  # type: ignore

    collection = db[collection_name]

    return collection, client


def fetch_periods(mongo_uri: str,
                  database_name: str):
    collection, client = connect_to_db("periods",
                                       mongo_uri,
                                       database_name)

    periods = list(collection.find())

    client.close()

    return periods


def fetch_applicants(periodId,
                     mongo_uri: str,
                     database_name: str):
    collection, client = connect_to_db("applications",
                                       mongo_uri=mongo_uri,
                                       database_name=database_name)

    applicants = list(collection.find({"periodId": periodId}))

    client.close()

    return applicants


def fetch_committee_times(periodId,
                          mongo_uri: str,
                          database_name: str):
    collection, client = connect_to_db("committees",
                                       mongo_uri=mongo_uri,
                                       database_name=database_name)

    committee_times = list(collection.find({"periodId": periodId}))

    client.close()

    return committee_times


def format_match_results(match_results: MeetingMatch, applicants: List[dict], periodId) -> List[Dict]:
    transformed_results = {}

    for result in match_results['matchings']:
        applicant_id = str(result[0])

        if applicant_id not in transformed_results:
            transformed_results[applicant_id] = {
                "periodId": periodId,
                "applicantId": applicant_id,
                "interviews": []
            }

        committee = result[1]
        time_interval = result[2]
        start = time_interval.start.isoformat()
        end = time_interval.end.isoformat()
        room = result[3]

        transformed_results[applicant_id]["interviews"].append({
            "start": start,
            "end": end,
            "committeeName": committee.name,
            "room": room
        })

    return list(transformed_results.values())


def create_applicant_objects(applicants_data: List[dict], all_committees: dict[str, Committee]) -> set[Applicant]:
    applicants = set()
    for data in applicants_data:
        applicant = Applicant(name=str(data['_id']))

        optional_committee_names = data.get('optionalCommittees', [])
        optional_committees = {
            all_committees[name] for name in optional_committee_names if name in all_committees}
        applicant.add_committees(optional_committees)

        preferences = data.get('preferences', {})
        preference_committees = {all_committees[committee_name] for committee_name in preferences.values(
        ) if committee_name in all_committees}
        applicant.add_committees(preference_committees)

        for interval_data in data['selectedTimes']:
            interval = TimeInterval(
                start=datetime.fromisoformat(
                    interval_data['start'].replace("Z", "+00:00")),
                end=datetime.fromisoformat(
                    interval_data['end'].replace("Z", "+00:00"))
            )
            applicant.add_interval(interval)

        applicants.add(applicant)
    return applicants


def create_committee_objects(committee_data: List[dict]) -> set[Committee]:
    committees = set()
    for data in committee_data:
        committee = Committee(name=data['committee'], interview_length=timedelta(
            minutes=int(data["timeslot"])))
        for interval_data in data['availabletimes']:
            interval = TimeInterval(
                start=datetime.fromisoformat(
                    interval_data['start'].replace("Z", "+00:00")),
                end=datetime.fromisoformat(
                    interval_data['end'].replace("Z", "+00:00"))
            )
            room = interval_data["room"]
            committee.add_interview_slot(interval, room)
        committees.add(committee)
    return committees


if __name__ == "__main__":
    main()
