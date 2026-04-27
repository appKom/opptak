interface TimeSlot {
  start: Date;
  end: Date;
}

interface ScheduleTimeSlot {
  date: string;
  time: string;
}

export const convertIsoToScheduleFormat = (
  timeSlots: TimeSlot[],
): ScheduleTimeSlot[] => {
  return timeSlots.map((slot) => {
    const startDate = slot.start;
    const endDate = slot.end;

    // Convert date to YYYY-MM-DD format
    const date = startDate.toISOString().split("T")[0];

    // Convert times to HH:MM format
    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Oslo",
    };
    const startTime = startDate.toLocaleTimeString("nb-NO", timeFormat);
    const endTime = endDate.toLocaleTimeString("nb-NO", timeFormat);

    const time = `${startTime} - ${endTime}`;

    return { date, time };
  });
};

export const isTimeSlotAvailable = (
  date: string,
  time: string,
  availableSlots: ScheduleTimeSlot[],
): boolean => {
  return availableSlots.some(
    (slot) => slot.date === date && slot.time === time,
  );
};
