import SuperJSON from "superjson";
import { OwGroup } from "../types/types";

const API_BASE_URL = "https://rpc.online.ntnu.no/api/trpc";

export async function getCommitteesFromOw() {
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
  const committees: OwGroup[] = committeeData.filter(
    (group: OwGroup) =>
      group.recruitmentMethod == "SPRING_APPLICATION" ||
      group.recruitmentMethod == "AUTUMN_APPLICATION",
  );
  return committees;
}
