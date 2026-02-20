import { NextApiRequest, NextApiResponse } from "next";
import { createApplicant, getApplicants } from "../../../lib/mongo/applicants";
import { authOptions } from "../auth/[...nextauth]";
import { getPeriodById } from "../../../lib/mongo/periods";
import { getServerSession } from "next-auth";
import { applicantType } from "../../../lib/types/types";
import { isApplicantType } from "../../../lib/utils/validators";
import { isAdmin, hasSession, checkOwId } from "../../../lib/utils/apiChecks";
import { sendConfirmationSMS } from "../../../lib/sms/sendConfirmationSMS";
import { sendConfirmationEmail } from "../../../lib/email/sendConfirmationEmail";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!hasSession(res, session)) return;

  try {
    if (req.method === "GET") {
      if (!isAdmin(res, session)) return;

      const { applicants, error } = await getApplicants();
      if (error) throw new Error(error);
      return res.status(200).json({ applicants });
    }

    if (req.method === "POST") {
      const requestBody: applicantType = req.body;
      requestBody.date = new Date(new Date().getTime() + 60 * 60 * 2000); // add date with norwegain time (GMT+2)

      const { period } = await getPeriodById(String(requestBody.periodId));

      if (!period) {
        return res.status(400).json({ error: "Invalid period id" });
      }

      if (!isApplicantType(req.body, period)) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      if (!checkOwId(res, session, requestBody.owId)) return;

      const now = new Date();
      const applicationStart = period.applicationPeriod.start;
      const applicationEnd = period.applicationPeriod.end;

      // Check if the current time is within the application period
      if (now < applicationStart || now > applicationEnd) {
        return res
          .status(400)
          .json({ error: "Not within the application period" });
      }

      const { applicant, error } = await createApplicant(requestBody);
      if (error) throw new Error(error);

      const mode = process.env.NODE_ENV;

      if (applicant && mode == "production") {
        let potentialError;

        try {
          await sendConfirmationEmail(applicant);
        } catch (error) {
          potentialError = error;
        } finally {
          await sendConfirmationSMS(applicant);
        }

        if (potentialError) {
          throw potentialError;
        }
      }

      return res.status(201).json({ applicant });
    }
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json("An unexpected error occurred");
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} is not allowed.`);
};

export default handler;
