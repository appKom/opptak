import type { NextApiRequest, NextApiResponse } from "next";
import { getInterviewsByPeriodAndApplicantId } from "../../../../lib/mongo/interviews";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { "period-id": periodId, "applicant-id": applicantId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { interviews, error } = await getInterviewsByPeriodAndApplicantId(
      periodId as string,
      applicantId as string,
    );

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch interviews" });
    }

    return res.status(200).json({ interviews });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export default handler;
