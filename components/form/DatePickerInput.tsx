import { useEffect, useState } from "react";
import { fromZonedTime } from 'date-fns-tz';
import { timezone } from "../../lib/utils/dateUtils";

interface Props {
  label?: string;
  updateDates: (dates: { start: Date; end: Date }) => void;
}

const DatePickerInput = (props: Props) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!fromDate || !toDate) return;


    // Convert to Date objects in correct timezone
    const startDate = fromZonedTime(
      `${fromDate}T00:00:00`,
      timezone
    );
    const endDate = fromZonedTime(
      `${toDate}T23:59:59`,
      timezone
    );

    props.updateDates({ start: startDate, end: endDate });
  }, [fromDate, toDate]);

  return (
    <div className="w-full max-w-xs mx-auto my-3 ">
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        {props.label}
      </label>
      <div className="flex items-center ">
        <input
          type="date"
          id={`${props.label}-from`}
          name={`${props.label}-from`}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 border-gray-300  text-gray-900 dark:border-gray-600 dark:bg-online-darkBlue dark:text-gray-200"
        />
        <span className="mx-4 text-gray-500 dark:text-gray-300">til</span>
        <input
          type="date"
          id={`${props.label}-to`}
          name={`${props.label}-to`}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-online-darkBlue dark:text-gray-200"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        NB: Alle tider er i norsk tidssone (GMT+1)
      </p>
    </div>
  );
};

export default DatePickerInput;