import ScheduleCell from "./ScheduleCell";
import { useState } from "react";
import getTimeSlots from "../../lib/utils/getTimeSlots";
import { convertIsoToScheduleFormat } from "../../lib/utils/convertIsoToScheduleFormat";

interface Props {
  date: string;
  weekDay: string;
  interviewLength: number;
  availableSlots: { start: string; end: string }[];
  onToggleAvailability: (
    date: string,
    time: string,
    isAvailable: boolean,
  ) => void;
}

export default function ScheduleColumn({
  date,
  weekDay,
  interviewLength,
  availableSlots,
  onToggleAvailability,
}: Props) {
  const [isDragging, setDragging] = useState(false);
  const timeSlots = getTimeSlots(interviewLength);
  const dateOfMonth = date.split("-")[2];
  const month = date.split("-")[1];

  const adjustedAvailableSlots = availableSlots.map((slot) => {
    slot.start = slot.start.replace("Z", "");
    slot.end = slot.end.replace("Z", "");
    return slot;
  });

  const availableTimeSlots = convertIsoToScheduleFormat(adjustedAvailableSlots);
  const availableTimes = availableTimeSlots.map((slot) => {
    let [firstTime, secondTime] = slot.time.split(" - ").map((s) => s.trim());
    return `${firstTime} - ${secondTime}`;
  });

  const convertTimeToNumber = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const initalAvailable = (time: string) => {
    if (availableTimes.length === 0) return true;
    return availableTimes.includes(time);
  };

  return (
    <div
      className="w-12 border-l border-gray-500 sm:w-24 md:w-28 lg:w-32 xl:w-36"
      onMouseDown={() => setDragging(true)}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      <div className="flex justify-center text-center">
        {weekDay} {dateOfMonth}.{month}
      </div>
      {timeSlots.map((time, index) => (
        <ScheduleCell
          date={date}
          time={time}
          interviewLength={interviewLength}
          isDragging={isDragging}
          initalAvailable={initalAvailable(time)}
          onToggleAvailability={onToggleAvailability}
          key={index}
        />
      ))}
    </div>
  );
}
