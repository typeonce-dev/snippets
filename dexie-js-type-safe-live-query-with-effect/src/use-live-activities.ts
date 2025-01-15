import { ActivityTable } from "./schema";
import { useDexieQuery } from "./use-dexie-query";

export const useLiveActivities = () => {
  // 👇 Get data with validation with `Schema`
  const { data, error, loading } = useDexieQuery(
    (_) => _.activity.toArray(),
    ActivityTable
  );

  return { data, error, loading }; // 👈 Return data with validation
};
