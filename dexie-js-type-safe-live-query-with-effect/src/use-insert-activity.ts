import { Dexie } from "./dexie";
import { useActionEffect } from "./use-action-effect";

export const useInsertActivity = () => {
  // 👇 Final API is as easy as it gets (all types inferred!)
  // `action: (payload: FormData) => void`
  const [{ error, data }, action, pending] = useActionEffect(
    Dexie.insertActivity
  );

  // Expose the values you need...
};
