import toast from "react-hot-toast";
import validator from "validator";

export const validateApplication = (applicationData: any) => {
  const {
    name,
    email,
    phone,
    grade,
    about,
    bankom,
    selectedTimes,
    optionalCommittees,
  } = applicationData;

  const { first, second, third } = applicationData.preferences;

  // Check if email is valid
  if (!validator.isEmail(email)) {
    toast.error("Fyll inn en gyldig e-postadresse");
    return false;
  }

  // Check if ntnu email is used
  if (email.includes("ntnu.no")) {
    toast.error(
      "Vi har problemer med å sende e-post til NTNU e-poster. Vennligst bruk en annen e-postadresse."
    );
    return false;
  }

  // Check if phone number is valid
  if (!validator.isMobilePhone(phone)) {
    toast.error("Fyll inn et gyldig mobilnummer");
    return false;
  }

  // Check if grade is valid
  if (grade == 0) {
    toast.error("Velg et trinn");
    return false;
  }

  // Check if about section is filled
  if (about === "") {
    toast.error("Skriv litt om deg selv");
    return false;
  }

  // Check if at least one preference is selected
  if (!first && !second && !third && optionalCommittees.length === 0) {
    toast.error("Velg minst én komité");
    return false;
  }

  // Check for duplicate committee preferences

  if (
    (first && second && first === second) ||
    (first && third && first === third) ||
    (second && third && second === third)
  ) {
    toast.error("Du kan ikke velge samme komité flere ganger");
    return false;
  }

  // Check if Bankom interest is specified
  if (bankom === undefined) {
    toast.error("Velg om du er interessert i Bankom");
    return false;
  }

  for (const time of selectedTimes) {
    const startTime = time.start;
    const endTime = time.end;
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      toast.error("Ugyldig start- eller sluttid");
      return false;
    }
    if (startTime >= endTime) {
      toast.error("Starttid må være før sluttid");
      return false;
    }
  }

  return true;
};
