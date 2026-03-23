import ScheduleColumn from "./ScheduleColumn";
import getTimeSlots from "../../lib/utils/getTimeSlots";
import { useState, useEffect, useCallback } from "react";
import { DeepPartial, applicantType } from "../../lib/types/types";
import ImportantNote from "../ImportantNote";
import { co } from "@fullcalendar/core/internal-common";

interface Props {
  interviewLength: number;
  periodTime: any;
  setApplicationData: Function;
  applicationData: DeepPartial<applicantType>;
}

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

interface IsoTimeSlot {
  start: string;
  end: string;
}

export default function Schedule({
  interviewLength,
  periodTime,
  setApplicationData,
  applicationData,
}: Props) {
  const timeSlots = getTimeSlots(interviewLength);

  const [selectedCells, setSelectedCells] = useState<TimeSlot[]>([]);

  const getDatesWithinPeriod = (
    periodTime: any,
  ): { [date: string]: string } => {
    if (!periodTime) return {};
    const startDate = new Date(periodTime.start);
    startDate.setHours(startDate.getHours() + 2);
    const endDate = new Date(periodTime.end);
    endDate.setHours(endDate.getHours() + 2);
    const dates: { [date: string]: string } = {};
    const dayNames = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayIndex = currentDate.getDay();
      if (dayIndex !== 0 && dayIndex !== 6) {
        // Exclude Sundays and Saturdays
        const dateStr = currentDate.toISOString().split("T")[0];
        dates[dateStr] = dayNames[dayIndex];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const parseTime = useCallback((time: string): [number, number] => {
    const [timeStr, period] = time.split(" ");
    let [hour, minute] = timeStr.split(":").map(Number);

    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    return [hour, minute];
  }, []);

  const convertToIso = useCallback(
    (date: string, timeSlot: string): IsoTimeSlot => {
      const [startTimeStr, endTimeStr] = timeSlot.split(" - ");
      const [year, month, day] = date.split("-").map(Number);

      const [startHour, startMinute] = parseTime(startTimeStr);
      const startTime = new Date(
        Date.UTC(year, month - 1, day, startHour, startMinute),
      );

      const [endHour, endMinute] = parseTime(endTimeStr);
      const endTime = new Date(
        Date.UTC(year, month - 1, day, endHour, endMinute),
      );

      return {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      };
    },
    [parseTime],
  );

  // Track if we've initialized (to prevent infinite loops)
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only initialize selectedTimes if not already set and not initialized
    if (isInitialized) return;
    if (
      applicationData.selectedTimes &&
      applicationData.selectedTimes.length > 0
    ) {
      setIsInitialized(true);
      return;
    }

    const dates = getDatesWithinPeriod(periodTime);
    const allAvailableTimes: { date: string; time: string }[] = [];

    Object.keys(dates).forEach((date) => {
      timeSlots.forEach((time) => {
        allAvailableTimes.push({ date, time });
      });
    });

    const isoTimeSlotsForExport = allAvailableTimes.map((slot) =>
      convertToIso(slot.date, slot.time),
    );

    setApplicationData((prevData: any) => ({
      ...prevData,
      selectedTimes: isoTimeSlotsForExport,
    }));
    setIsInitialized(true);
  }, [
    isInitialized,
    applicationData.selectedTimes,
    periodTime,
    timeSlots,
    convertToIso,
    setApplicationData,
  ]);

  // Separate state to track pending updates
  const [pendingUpdate, setPendingUpdate] = useState<any[] | null>(null);

  // Sync pendingUpdate to applicationData (runs after render)
  useEffect(() => {
    if (pendingUpdate !== null) {
      setApplicationData((prevData: any) => ({
        ...prevData,
        selectedTimes: pendingUpdate,
      }));
      setPendingUpdate(null);
    }
  }, [pendingUpdate, setApplicationData]);

  const handleToggleAvailability = (
    date: string,
    time: string,
    available: boolean,
  ) => {
    setSelectedCells((prevCells) => {
      const index = prevCells.findIndex(
        (cell) => cell.date === date && cell.time === time,
      );

      let newCells;
      if (index !== -1) {
        newCells = [...prevCells];
        newCells[index] = { date, time, available };
      } else {
        newCells = [...prevCells, { date, time, available }];
      }

      const selectedSet = new Set(
        newCells
          .filter((cell) => !cell.available)
          .map((cell) => `${cell.date}-${cell.time}`),
      );

      const dates = getDatesWithinPeriod(periodTime);
      const dataToSend: { date: string; time: string }[] = [];
      Object.keys(dates).forEach((date) => {
        timeSlots.forEach((slot) => {
          const slotKey = `${date}-${slot}`;
          if (!selectedSet.has(slotKey)) {
            dataToSend.push({ date, time: slot });
          }
        });
      });

      const isoTimeSlotsForExport = dataToSend.map((slot) =>
        convertToIso(slot.date, slot.time),
      );

      // Queue the update instead of calling setApplicationData directly
      setPendingUpdate(isoTimeSlotsForExport);

      return newCells;
    });
  };

  const dates = getDatesWithinPeriod(periodTime);

  let weekDates: { [date: string]: IsoTimeSlot[] } = {};

  Object.keys(dates).forEach((date) => {
    weekDates[date] = [];
    applicationData.selectedTimes?.forEach((slot) => {
      if (slot?.start?.includes(date) && slot?.end) {
        weekDates[date].push({ start: slot.start, end: slot.end });
      }
    });
  });

  return (
    <div className="flex flex-col items-center">
      <ImportantNote
        prefix="Valgfritt"
        text={
          <>
            Legg inn tider du&nbsp;<span className="font-bold">IKKE</span>
            &nbsp;er ledig for intervju. Flere ledige tider øker sjansen for
            automatisk tildeling av intervjutider!
          </>
        }
      />
      <div className="flex gap-10">
        <AvailabilityIndicator isAvailable />
        <AvailabilityIndicator />
      </div>
      <div className="flex px-5 py-4 mt-5 border border-gray-200 rounded-md shadow w-max dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col justify-end">
          {timeSlots.map((time, index) => (
            <div
              className="flex items-center justify-center h-8 px-4 text-sm border-t border-gray-500"
              key={index}
            >
              {time}
            </div>
          ))}
        </div>
        {Object.keys(dates).map((date, index) => (
          <ScheduleColumn
            date={date}
            weekDay={dates[date]}
            interviewLength={interviewLength}
            availableSlots={weekDates[date]}
            onToggleAvailability={handleToggleAvailability}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

const AvailabilityIndicator = ({ isAvailable }: { isAvailable?: boolean }) => {
  return (
    <div className="flex items-center gap-2 text-gray-700 dark:text-white">
      <div
        className={`w-16 h-8 border border-gray-300 rounded-sm dark:border-gray-700 ${
          isAvailable ? "bg-green-300" : "bg-red-300"
        }`}
      ></div>
      <div>
        Jeg er {!isAvailable && <span className="font-bold">IKKE</span>} ledig
      </div>
    </div>
  );
};
