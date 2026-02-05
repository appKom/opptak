import { NextApiRequest, NextApiResponse } from "next";
import { createCommittee } from "../../../../../lib/mongo/committees";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
import { hasSession, isInCommitee } from "../../../../../lib/utils/apiChecks";
import {
  isCommitteeType,
  validateCommittee,
} from "../../../../../lib/utils/validators";
import { getPeriodById } from "../../../../../lib/mongo/periods";
import { committeeInterviewType } from "../../../../../lib/types/types";
import { isAfter } from "date-fns";

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

  if (req.method === "POST") {
    const committeeData: committeeInterviewType = req.body;

    if (!isCommitteeType(req.body)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const { period } = await getPeriodById(String(committeeData.periodId));
    if (!period) {
      return res.status(400).json({ error: "Invalid periodId" });
    }

    const now = new Date();

    if (isAfter(now, period.interviewPeriod.end)) {
      return res.status(400).json({ error: "Application period has ended" });
    }

    if (!validateCommittee(committeeData, period)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    try {
      const { committee, error } = await createCommittee(
        committeeData,
        session!.user?.committees ?? [],
        periodId
      );
      if (error) throw new Error(error);

      return res.status(201).json({ committee });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} is not allowed.`);
};

export default handler;
