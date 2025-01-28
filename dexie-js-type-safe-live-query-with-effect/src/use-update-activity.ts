import { Dexie } from "./dexie";
import { useActionEffect } from "./use-action-effect";

export const useUpdateActivity = () => {
  // 👇 Final API is as easy as it gets (all types inferred!)
  // `action: (payload: { readonly name: string; readonly activityId: string; }) => void`
  const [{ error, data }, action, pending] = useActionEffect(
    Dexie.updateActivity
  );

  // Expose the values you need...
};
