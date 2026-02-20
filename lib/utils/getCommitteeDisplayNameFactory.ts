import { fetchOwCommittees } from "../api/committeesApi";

export const getCommitteeDisplayNameFactory = async () => {
  const committees = await fetchOwCommittees();

  /**
   * Returns "name_long (name_short)" for the given committee
   *
   * Defaults to given committee name if no long name is found.
   *
   * @param committee Short name (name_short) of committee
   */
  const getCommitteeDisplayName = (committee: string) => {
    const name = committees.find(
      ({ abbreviation }) => abbreviation == committee,
    )?.name;

    return name ? `${name} (${committee})` : committee;
  };

  return getCommitteeDisplayName;
};
