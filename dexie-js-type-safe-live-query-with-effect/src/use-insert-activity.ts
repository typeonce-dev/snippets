import { Effect, Schema } from "effect";
import { Dexie } from "./dexie";
import { useActionEffect } from "./use-action-effect";

export const useInsertActivity = () => {
  return useActionEffect((formData) =>
    Effect.gen(function* () {
      const api = yield* Dexie;

      // 👇 Execute query from `Dexie` service (type-safe)
      const query = api.insertActivity<"name">(
        Schema.Struct({ name: Schema.NonEmptyString })
      );

      return yield* query(formData);
    })
  );
};
