import TextInput from "./TextInput";
import RadioInput from "./RadioInput";
import TextAreaInput from "./TextAreaInput";
import SelectInput from "./SelectInput";
import Line from "./Line";
import { DeepPartial, applicantType } from "../../lib/types/types";
import { changeDisplayName } from "../../lib/utils/toString";
import { useEffect, useState } from "react";
import CustomPhoneInput from "./CustomPhoneInput";
import "react-phone-input-2/lib/bootstrap.css";

interface Props {
  applicationData: DeepPartial<applicantType>;
  setApplicationData: Function;
  availableCommittees: string[];
  optionalCommittees: string[];
  getCommitteeDisplayName: (committee: string) => string;
}

export const ApplicationForm = (props: Props) => {
  const [isNtnuEmail, setIsNtnuEmail] = useState<boolean>(false);
  const availableCommittees = [["Ingen", ""]];
  const [selectedOptionalCommittees, setSelectedOptionalCommittees] = useState<
    string[]
  >([]);

  props.availableCommittees.forEach((committee) => {
    if (!availableCommittees.some((item) => item[1] === committee)) {
      availableCommittees.push([
        props.getCommitteeDisplayName(committee),
        committee.toLowerCase(),
      ]);
    }
  });

  const optionalCommittees: string[] = props.optionalCommittees.map(
    (committee) => committee.toLowerCase(),
  );

  const addOptionalCommittee = (committee: string, value: string) => {
    let updatedCommittees = [...selectedOptionalCommittees];

    if (value === "ja" && !updatedCommittees.includes(committee)) {
      updatedCommittees.push(committee);
    } else if (value === "nei" && updatedCommittees.includes(committee)) {
      updatedCommittees = updatedCommittees.filter(
        (item) => item !== committee,
      );
    }

    setSelectedOptionalCommittees(updatedCommittees);
    props.setApplicationData({
      ...props.applicationData,
      optionalCommittees: updatedCommittees,
    });
  };

  useEffect(() => {
    if (
      props.applicationData.email &&
      props.applicationData.email.includes("ntnu.no")
    ) {
      setIsNtnuEmail(true);
    } else {
      setIsNtnuEmail(false);
    }
  }, [props.applicationData.email]);

  // Initialize selectedOptionalCommittees with existing data
  useEffect(() => {
    if (props.applicationData.optionalCommittees) {
      setSelectedOptionalCommittees(
        props.applicationData.optionalCommittees.filter(Boolean) as string[],
      );
    }
  }, [props.applicationData.optionalCommittees]);

  return (
    <div className="flex items-center justify-center">
      <form className="w-full max-w-sm px-5 text-online-darkBlue dark:text-white">
        {isNtnuEmail && (
          <div className="px-5">
            <p className="text-red-500">
              Vi har problemer med å sende e-post til NTNU e-poster. Vennligst
              bruk en annen e-postadresse.
            </p>
          </div>
        )}
        <TextInput
          label="E-postadresse"
          defaultValue={props.applicationData.email}
          updateInputValues={(value: string) =>
            props.setApplicationData({ ...props.applicationData, email: value })
          }
        />
        <TextInput
          label="Fullt navn"
          defaultValue={props.applicationData.name}
          updateInputValues={(value: any) =>
            props.setApplicationData({ ...props.applicationData, name: value })
          }
        />

        <CustomPhoneInput
          updateInputValues={(value: any) =>
            props.setApplicationData({ ...props.applicationData, phone: value })
          }
          label="Telefonnummer"
          defaultValue={props.applicationData.phone}
        />

        <SelectInput
          required
          defaultValue={
            props.applicationData.grade === undefined
              ? "Velg trinn"
              : props.applicationData.grade
          }
          values={[
            ["1.", 1],
            ["2.", 2],
            ["3.", 3],
            ["4.", 4],
            ["5.", 5],
          ]}
          label="Hvilket trinn går du?"
          updateInputValues={(value: number) =>
            props.setApplicationData({
              ...props.applicationData,
              grade: value,
            })
          }
        />
        <Line />
        <TextAreaInput
          label="Skriv litt om deg selv"
          value={props.applicationData.about || ""}
          updateInputValues={(value: any) =>
            props.setApplicationData({ ...props.applicationData, about: value })
          }
          maxLength={1000}
        />
        <Line />

        {props.availableCommittees.length > 0 && (
          <>
            <div className="flex justify-center">
              <label className="inline-block mt-6 text-gray-700 dark:text-white form-label">
                {availableCommittees.length > 2
                  ? `Velg opptil 3 komiteer`
                  : `Velg opptil ${availableCommittees.length - 1} komiteer`}
              </label>
            </div>
            <SelectInput
              required
              values={availableCommittees}
              defaultValue={
                typeof props.applicationData.preferences === "object" &&
                "first" in props.applicationData.preferences
                  ? props.applicationData.preferences.first
                  : ""
              }
              label={
                availableCommittees.length > 2 ? "Førstevalg" : "Velg komite"
              }
              updateInputValues={(value: string) =>
                props.setApplicationData({
                  ...props.applicationData,
                  preferences: {
                    ...props.applicationData.preferences,
                    first: value,
                  },
                })
              }
            />
          </>
        )}

        {availableCommittees.length > 2 && (
          <SelectInput
            values={availableCommittees}
            label="Andrevalg"
            defaultValue={
              typeof props.applicationData.preferences === "object" &&
              "second" in props.applicationData.preferences
                ? props.applicationData.preferences.second
                : ""
            }
            updateInputValues={(value: string) =>
              props.setApplicationData({
                ...props.applicationData,
                preferences: {
                  ...props.applicationData.preferences,
                  second: value,
                },
              })
            }
          />
        )}
        {availableCommittees.length > 3 && (
          <SelectInput
            values={availableCommittees}
            label="Tredjevalg"
            defaultValue={
              typeof props.applicationData.preferences === "object" &&
              "third" in props.applicationData.preferences
                ? props.applicationData.preferences.third
                : ""
            }
            updateInputValues={(value: string) =>
              props.setApplicationData({
                ...props.applicationData,
                preferences: {
                  ...props.applicationData.preferences,
                  third: value,
                },
              })
            }
          />
        )}
        <Line />
        <RadioInput
          values={[
            ["Ja", "ja"],
            ["Nei", "nei"],
            ["Usikker (gjerne spør om mer info på intervjuet)", "kanskje"],
          ]}
          label="Er du interessert i å være økonomiansvarlig i komiteen (tilleggsverv i Bankom)?"
          defaultValue={props.applicationData.bankom as string}
          updateInputValues={(value: boolean) =>
            props.setApplicationData({
              ...props.applicationData,
              bankom: value,
            })
          }
        />
        {optionalCommittees.map((committee) => (
          <div key={committee}>
            <RadioInput
              values={[
                ["Ja", "ja"],
                ["Nei", "nei"],
              ]}
              label={`Ønsker du å søke ${changeDisplayName(committee)} ${
                availableCommittees.length > 1 ? "i tillegg?" : "?"
              }`}
              defaultValue={
                selectedOptionalCommittees.includes(committee) ? "ja" : "nei"
              }
              updateInputValues={(value: string) =>
                addOptionalCommittee(committee, value)
              }
            />
          </div>
        ))}
      </form>
    </div>
  );
};

export default ApplicationForm;
