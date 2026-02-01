import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { getCommitteesFromOw } from "../../../lib/ow/committees";
import { OwGroup } from "../../../lib/types/types";
import { hasSession } from "../../../lib/utils/apiChecks";
import { authOptions } from "../auth/[...nextauth]";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!hasSession(res, session)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} is not allowed.`);
  }

  try {
    const committees: OwGroup[] = await getCommitteesFromOw();

    return res.status(200).json(committees);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export default handler;
