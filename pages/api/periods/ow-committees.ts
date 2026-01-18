import { NextApiRequest, NextApiResponse } from "next";
import { authOptions, OwGroup } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { hasSession } from "../../../lib/utils/apiChecks";
import { OwCommittee } from "../../../lib/types/types";
import SuperJSON from "superjson";

const API_BASE_URL = "https://rpc.online.ntnu.no/api/trpc";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!hasSession(res, session)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} is not allowed.`);
  }

  try {
    const commiteeUrl = `${API_BASE_URL}/group.all`;

    const committeeResponse = await fetch(commiteeUrl, {
      method: "GET", // GET works for read queries
      headers: { "content-type": "application/json" },
    });

    if (!committeeResponse.ok) {
      throw new Error("Failed to fetch committees");
    }

    const committeeData: OwGroup[] = SuperJSON.parse(
      JSON.stringify((await committeeResponse.json()).result.data),
    );

    // TODO: Ta med komité-id (finnes det i det hele tatt?)
    const committees: OwCommittee[] = committeeData
      .filter(
        (group: OwGroup) =>
          group.recruitmentMethod == "SPRING_APPLICATION" ||
          group.recruitmentMethod == "AUTUMN_APPLICATION",
      )
      .map((group: OwGroup) => ({
        name_short: group.abbreviation,
        name_long: group.name,
        email: group.email,
        description_short: group.shortDescription,
        description_long: group.description,
        image: { xs: group.imageUrl, sm: group.imageUrl }, // TODO: Update to reflect new api
        application_description: group.description,
        type: group.type,
      }));

    return res.status(200).json(committees);

    return res.status(200).json(committees);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export default handler;
