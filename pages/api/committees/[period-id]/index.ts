import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { hasSession, isAdmin, isInCommitee } from "../../../../lib/utils/apiChecks";
import { getCommitteesByPeriod } from "../../../../lib/mongo/committees";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);
  const periodId = req.query["period-id"];

  if (!periodId || typeof periodId !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid or missing periodId parameter" });
  }

  if (!hasSession(res, session)) return;
  if (!isInCommitee(res, session)) return;

  if (req.method === "GET") {
    if (!isAdmin(res, session)) return;

    try {
      const { result } = await getCommitteesByPeriod(periodId);

      return res.status(200).json({ result })
    } catch (error) {
      return res.status(500).json(error)
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} is not allowed.`);
};

export default handler;
