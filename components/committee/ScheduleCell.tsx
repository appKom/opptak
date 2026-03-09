import { useState, BaseSyntheticEvent } from "react";

interface Props {
  date: string;
  time: string;
  interviewLength: number;
  isDragging: boolean;
  initalAvailable?: boolean;
  onToggleAvailability: (
    date: string,
    time: string,
    isAvailable: boolean,
  ) => void;
}

export default function ScheduleCell(props: Props) {
  const [available, setAvailable] = useState(props.initalAvailable);

  const handleToggle = () => {
    setAvailable((prevAvailable) => {
      const newAvailable = !prevAvailable;
      props.onToggleAvailability(props.date, props.time, newAvailable);
      return newAvailable;
    });
  };

  const handleMouseEvent = (e: BaseSyntheticEvent, dragging: boolean) => {
    if (dragging && !props.isDragging) {
      return;
    }
    handleToggle();
  };

  const bgColorClass = available
    ? "bg-green-300 hover:bg-green-200"
    : "bg-red-300 hover:bg-red-200";

  return (
    <div
      className={`flex h-8 ${bgColorClass} border-t border-gray-500 cursor-pointer odd:border-dotted`}
      onMouseEnter={(e: BaseSyntheticEvent) => handleMouseEvent(e, true)}
      onMouseDown={(e: BaseSyntheticEvent) => handleMouseEvent(e, false)}
    />
  );
}
