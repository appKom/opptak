import Table from "../Table";
import { SimpleTitle } from "../Typography";

const testData = [
  {
    period: "test",
    perCommittee: {
      appkom: 100,
      prokom: 30,
      dotkom: 70,
      arrkom: 40,
      ditkom: 60,
    },
    totalApplicants: 100,
    totalApplications: 300,
  },
];

export const PreviousAdmissions = () => {
  return (
    <div className="m-auto flex flex-col items-center justify-center">
      <SimpleTitle title="Søkertall ved tidligere opptak" />

      <Table
        columns={[{ label: "test", field: "test" }]}
        rows={[{ id: "0", test: 4 }]}
      />
    </div>
  );
};
