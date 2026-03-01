import { useEffect, useState } from "react";
interface Props {
  label?: string;
  fromDate?: string;
  toDate?: string;
  updateDates: (dates: { start: string; end: string }) => void;
}

const DatePickerInput = (props: Props) => {

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
          value={props.fromDate ?? ""}
          onChange={(e) => props.updateDates({start: `${e.target.value}T00:00`, end: props.toDate ? `${props.toDate}T00:00` : ""})}
          className="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 border-gray-300  text-gray-900 dark:border-gray-600 dark:bg-online-darkBlue dark:text-gray-200"
        />
        <span className="mx-4 text-gray-500 dark:text-gray-300">til</span>
        <input
          type="date"
          id={`${props.label}-to`}
          name={`${props.label}-to`}
          value={props.toDate ?? ""}
          onChange={(e) => props.updateDates({start: props.fromDate ? `${props.fromDate}T00:00` : "", end: `${e.target.value}T00:00`})}
          className="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 border-gray-300 text-gray-900 dark:border-gray-600 dark:bg-online-darkBlue dark:text-gray-200"
        />
      </div>
    </div>
  );
};

export default DatePickerInput;
