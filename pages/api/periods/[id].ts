import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { deletePeriodById, editPeriodById, getPeriodById } from "../../../lib/mongo/periods";
import { hasSession, isAdmin } from "../../../lib/utils/apiChecks";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!hasSession(res, session)) return;

  const id = req.query.id;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  try {
    if (req.method === "GET") {
      const { period, exists, error } = await getPeriodById(id);

      if (error) {
        return res.status(500).json({ error });
      }

      if (!exists) {
        return res.status(404).json({ message: "Period not found" });
      }

      return res.status(200).json({ exists, period });
    } else if (req.method === "DELETE") {
      if (!isAdmin(res, session))
        return res.status(403).json({ error: "Unauthorized" });

      const { error } = await deletePeriodById(id);
      if (error) throw new Error(error);
      return res.status(204).end();
    } else if (req.method === "PATCH") {
        if (!isAdmin(res, session)) 
          return res.status(403).json({ error: "Unauthorized" });

        const { error } = await editPeriodById(id, req.body);

        if (error) {
          return res.status(500).json({ error });
        }

        return res.status(200).json({ message: "Period updated" });
      }
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json("Unexpected error occurred");
  }

  res.setHeader("Allow", ["GET", "DELETE", "PATCH"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};

export default handler;
