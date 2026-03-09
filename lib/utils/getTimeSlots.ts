const startTime = new Date(0);
startTime.setHours(8, 0, 0);

const endTime = new Date(0);
endTime.setHours(18, 0, 0);

export default function getTimeSlots(interviewLength: number) {
  const timeSlots: string[] = [];
  let currentTime = new Date(startTime);

  while (currentTime < endTime) {
    const slotStartTime = currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    currentTime.setMinutes(currentTime.getMinutes() + interviewLength);
    const slotEndTime = currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    timeSlots.push(`${slotStartTime} - ${slotEndTime}`);
  }

  return timeSlots;
}
