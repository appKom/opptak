interface Interview {
  committeeName: string;
  end: string;
  room: string;
  start: string;
}

const InterviewConfirmationBox = ({ interview }: { interview: Interview }) => {
  const day = new Date(interview.start).toLocaleDateString("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeSlot =
    new Date(interview.start).toLocaleTimeString("no-NO", {
      hour: "2-digit",
      minute: "2-digit",
    }) +
    " - " +
    new Date(interview.end).toLocaleTimeString("no-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md">
      {/* Header with committeeName and buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="col-span-1">
          <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {interview.committeeName}
          </p>
        </div>
        <div className="col-span-2 flex gap-2 justify-end">
          <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium">
            Avvis
          </button>
          <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium">
            Bekreft
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Dato */}
        <div className="col-span-1">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {day}
          </p>
        </div>

        {/* Tidsrom */}
        <div className="col-span-1">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {timeSlot}
          </p>
        </div>

        {/* Rom */}
        <div className="col-span-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rom</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {interview.room}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewConfirmationBox;
