import { NextApiRequest, NextApiResponse } from "next";
import { hasSession, isAdmin } from "../../../../lib/utils/apiChecks";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { markMatchedInterviewsByPeriodId } from "../../../../lib/mongo/periods";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const periodId = req.query["period-id"];

  if (typeof periodId !== "string") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!hasSession(res, session)) return;

  if (!isAdmin(res, session)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const response = await fetch(
      `${process.env.MATCHING_API_URL}?period=${periodId}&pushToDB=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.MATCHING_API_SECRET!,
          "Database-Name": process.env.NODE_ENV,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "Failed to match interviews",
        details: errorText,
      });
    }

    await markMatchedInterviewsByPeriodId(periodId);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
