import { NextApiRequest, NextApiResponse } from "next";
import {
  getCommittees,
  deleteCommittee,
} from "../../../../../lib/mongo/committees";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
import { hasSession, isInCommitee } from "../../../../../lib/utils/apiChecks";
import { getPeriodById } from "../../../../../lib/mongo/periods";
import { isAfter } from "date-fns";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!hasSession(res, session)) return;
  if (!isInCommitee(res, session)) return;

  const periodId = req.query["period-id"];
  const selectedCommittee = req.query.committee;

  if (typeof selectedCommittee !== "string") {
    return res.status(400).json({ error: "Invalid committee parameter" });
  }

  if (!periodId || typeof periodId !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid or missing periodId parameter" });
  }

  if (req.method === "GET") {
    try {
      const { committees, error } = await getCommittees(
        periodId,
        selectedCommittee,
        session!.user?.committees ?? []
      );

      if (error) throw new Error(error);

      return res.status(200).json({ committees: committees });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { period } = await getPeriodById(String(periodId));
      if (!period) {
        return res.status(400).json({ error: "Invalid periodId" });
      }

      const now = new Date();

      if (isAfter(now, period.interviewPeriod.end)) {
        return res.status(400).json({ error: "Application period has ended" });
      }

      const { error } = await deleteCommittee(
        selectedCommittee,
        periodId,
        session!.user?.committees ?? []
      );
      if (error) throw new Error(error);

      return res
        .status(200)
        .json({ message: "Committee successfully deleted." });
    } catch (error: any) {
      console.error("Deletion failed with error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return res.status(405).end(`Method ${req.method} is not allowed.`);
};

export default handler;
