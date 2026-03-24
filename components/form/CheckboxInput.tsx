import React, { useEffect, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface CheckboxOption {
  name: string;
  value: string;
  description: string;
}

interface Props {
  updateInputValues: (selectedValues: string[]) => void;
  label: string;
  values: CheckboxOption[];
  required?: boolean;
  order: number;
  info?: string;
  checkedItems?: string[];
}

const CheckboxInput = (props: Props) => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!props.checkedItems) return;
    setCheckedItems(props.checkedItems);
  }, [props.checkedItems]);

  const handleInputChange = (e: React.BaseSyntheticEvent) => {
    const value = e.target.value;
    const isChecked = e.target.checked;

    if (isChecked) {
      setCheckedItems((prev) => [...prev, value]);
    } else {
      setCheckedItems((prev) => prev.filter((item) => item !== value));
    }

    props.updateInputValues(
      isChecked
        ? [...checkedItems, value]
        : checkedItems.filter((item) => item !== value)
    );
  };

  const handleCheckAll = () => {
    if (props.values.length === checkedItems.length) {
      setCheckedItems([]);
      props.updateInputValues([]);
    } else {
      const allValues = props.values.map((item) => item.value);
      setCheckedItems(allValues);
      props.updateInputValues(allValues);
    }
  };

  const toggleInfo = () => setShowInfo(!showInfo);

  return (
    <div className="w-full max-w-xs mx-auto my-6">
      <div className="relative">
        <div className="flex items-center gap-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {props.label}
          </label>
          {props.required && (
            <span className="text-red-500 dark:text-red-400">*</span>
          )}
          {props.info && (
            <InformationCircleIcon
              onClick={toggleInfo}
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="w-5 h-5 text-gray-700 dark:text-white"
            />
          )}
        </div>
        {showInfo && (
          <div className="absolute right-0 w-full bg-white border rounded shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <p className="p-2 text-sm text-gray-700 dark:text-gray-300">
              {props.info}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={handleCheckAll}
          className="mt-2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600"
        >
          Velg alle
        </button>
        <div className="mt-2">
          {props.values.map((option, index) => (
            <div
              key={index}
              className="flex items-center p-2 space-x-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <input
                id={`checkbox-${index}-${props.order}`}
                name={option.name}
                type="checkbox"
                value={option.value}
                onChange={handleInputChange}
                checked={checkedItems.includes(option.value)}
                className="w-4 h-4 border-gray-300 rounded shadow-sm cursor-pointer text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:text-primary-400 dark:focus:ring-primary-300"
                required={props.required}
              />
              <label
                htmlFor={`checkbox-${index}-${props.order}`}
                className="flex w-full space-x-2 text-sm text-gray-700 cursor-pointer dark:text-gray-200"
              >
                <span>{option.name}</span>
                {option.description && (
                  <span className="text-gray-500 dark:text-gray-400">
                    ({option.description})
                  </span>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckboxInput;
