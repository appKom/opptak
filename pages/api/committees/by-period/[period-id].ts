import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { hasSession, isAdmin } from "../../../../lib/utils/apiChecks";
import { getCommitteesByPeriod } from "../../../../lib/mongo/committees";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!hasSession(res, session)) return;
  if (!isAdmin(res, session)) return;

  const periodId = req.query["period-id"];
  if (!periodId || typeof periodId !== "string") {
    return res.status(400).json({ error: "Invalid or missing periodId" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} is not allowed.`);
  }

  try {
    const { result, error } = await getCommitteesByPeriod(periodId);
    if (error) throw new Error(error);

    return res.status(200).json({ committees: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export default handler;
