import { ObjectId } from "mongodb";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
}

export type preferencesType = {
  first: string;
  second: string;
  third: string;
};

export type committeePreferenceType = {
  committee: string;
};

export type applicantType = {
  _id: ObjectId;
  owId: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  about: string;
  preferences: preferencesType | committeePreferenceType[];
  bankom: bankomOptionsType;
  optionalCommittees: string[];
  selectedTimes: [
    {
      start: Date;
      end: Date;
    },
  ];
  date: Date;
  periodId: string | ObjectId;
};

export type bankomOptionsType = "ja" | "nei" | "kanskje" | undefined;

// applicantType modified to fit email content
export type emailDataType = {
  name: string;
  emails: string[];
  phone: string;
  grade: string;
  about: string;
  firstChoice: string;
  secondChoice: string;
  thirdChoice: string;
  bankom: "Ja" | "Nei" | "Kanskje";
  optionalCommittees: string;
};

export type periodType = {
  _id: ObjectId;
  name: string;
  description: string;
  applicationPeriod: {
    start: Date;
    end: Date;
  };
  interviewPeriod: {
    start: Date;
    end: Date;
  };
  committees: string[];
  optionalCommittees: string[];
  hasSentInterviewTimes: boolean;
};

export type AvailableTime = {
  start: Date;
  end: Date;
  room: string;
};

export type committeeInterviewType = {
  periodId: string;
  period_name: string;
  committee: string;
  committeeEmail: string;
  availabletimes: AvailableTime[];
  timeslot: string; // duration of each interview in minutes
  message: string;
};

/**
 * A type representing a group from the OW API: {BASE_API}/group.all
 *
 * Includes only a subset of the properties available in the api, namely those we need.
 */
export interface OwGroup {
  type: string;
  recruitmentMethod:
    | "NONE"
    | "SPRING_APPLICATION"
    | "AUTUMN_APPLICATION"
    | "GENERAL_ASSEMBLY"
    | "NOMINATION"
    | "OTHER";
  slug: string;
  abbreviation: string;
  name: string;
  email: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
}

export type algorithmType = {
  applicantId: string;
  interviews: {
    start: Date;
    end: Date;
    committeeName: string;
    room: string;
  }[];
};

export type committeeEmails = {
  name_short: string;
  email: string;
};

export type emailCommitteeInterviewType = {
  periodId: string;
  period_name: string;
  committeeName: string;
  committeeEmail: string;
  applicants: {
    applicantName: string;
    applicantPhone: string;
    applicantEmail: string;
    interviewTime: {
      start: Date;
      end: Date;
      room: string;
    };
  }[];
};

export type emailApplicantInterviewType = {
  periodId: string;
  period_name: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  committees: {
    committeeName: string;
    committeeEmail: string;
    interviewTime: {
      start: Date;
      end: Date;
      room: string;
    };
  }[];
};
