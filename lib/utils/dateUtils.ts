export const formatDate = (inputDate: undefined | Date) => {
  if (!inputDate) return "";

  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);

  return date.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Oslo",
  });
};

export const formatDateHours = (
  start: string | Date,
  end: string | Date,
) => {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  const timeFormat: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Oslo",
  };

  const startTime = startDate.toLocaleTimeString("nb-NO", timeFormat);
  const endTime = endDate.toLocaleTimeString("nb-NO", timeFormat);

  return `${formatDateNorwegian(startDate)}, ${startTime} til ${endTime}`;
};

export const formatDateNorwegian = (inputDate?: Date | string) => {
  if (!inputDate) return "";

  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);

  const day = date
    .toLocaleDateString("nb-NO", {
      day: "2-digit",
      timeZone: "Europe/Oslo",
    })
    .replace(".", "");

  const month = date
    .toLocaleDateString("nb-NO", {
      month: "short",
      timeZone: "Europe/Oslo",
    })
    .replace(".", "");

  return `${day}. ${month}`;
};
