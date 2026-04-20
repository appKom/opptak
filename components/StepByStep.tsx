import { ReactNode } from "react";

interface Props {
  item: {
    color?: string;
    icon?: ReactNode;
    title?: string;
    content: string[];
  };
}

export const StepByStep = ({ item }: Props) => {
  return (
    <>
      <div className="flex flex-row items-center gap-4 mb-4 xl:items-start xl:flex-col">
        <div
          className={`p-4 ${
            item.color === "red"
              ? "bg-red-100"
              : item.color === "blue"
              ? "bg-blue-100"
              : item.color === "yellow"
              ? "bg-yellow-100"
              : ""
          } rounded w-min h-min`}
        >
          {item.icon}
        </div>
        {item.title && (
          <div className="text-2xl font-semibold xl:mb-8 dark:text-white">
            {item.title}
          </div>
        )}
      </div>
      <div className="flex flex-col xl:gap-4">
        {item.content.map((content, index) => (
          <div key={index} className="flex items-center gap-4 mb-2">
            <div className="text-xl font-bold text-blue-600">{index + 1}</div>
            {content}
          </div>
        ))}
      </div>
    </>
  );
};
