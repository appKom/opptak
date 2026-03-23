interface IsoTimeSlot {
  start: string;
  end: string;
}

interface ScheduleTimeSlot {
  date: string;
  time: string;
}

export const convertIsoToScheduleFormat = (
  isoTimeSlots: IsoTimeSlot[],
): ScheduleTimeSlot[] => {
  return isoTimeSlots.map((slot) => {
    const startDate = new Date(slot.start);
    const endDate = new Date(slot.end);

    // Convert date to YYYY-MM-DD format
    const date = startDate.toISOString().split("T")[0];

    // Convert times to HH:MM format
    const startTime = startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = endDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

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
