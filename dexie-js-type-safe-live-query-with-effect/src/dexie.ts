import * as _Dexie from "dexie";
import { Data, Effect, Schema } from "effect";
import { type ActivityTable } from "./schema";

class WriteApiError extends Data.TaggedError("WriteApiError")<{
  cause: unknown;
}> {}

const formDataToRecord = (formData: FormData): Record<string, string> => {
  const record: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      record[key] = value;
    }
  }
  return record;
};

export class Dexie extends Effect.Service<Dexie>()("Dexie", {
  effect: Effect.gen(function* () {
    const db = new _Dexie.Dexie("_db") as _Dexie.Dexie & {
      // 👇 Extract table type from `Schema`
      activity: _Dexie.EntityTable<typeof ActivityTable.Encoded, "activityId">;
    };

    db.version(1).stores({
      activity: "++activityId, &name",
    });

    // 👇 Decode `FormData` and then validate using `Schema`
    const execute =
      <I, A, T>(schema: Schema.Schema<A, I>, exec: (values: I) => Promise<T>) =>
      <const R extends string = never>(
        source: Schema.Schema<I, Record<NoInfer<R>, string>>
      ) =>
      (formData: FormData) =>
        // 1️⃣ Decode `FormData` to `Record<string, string>`
        Schema.decodeUnknown(source)(formDataToRecord(formData)).pipe(
          // 2️⃣ Validate the decoded data with `Schema`
          Effect.flatMap(Schema.decode(schema)),
          Effect.flatMap(Schema.encode(schema)),
          Effect.mapError((error) => new WriteApiError({ cause: error })),
          Effect.flatMap((values) =>
            Effect.tryPromise({
              // 3️⃣ Execute the query
              try: () => exec(values),
              catch: (error) => new WriteApiError({ cause: error }),
            })
          )
        );

    return {
      db, // 👈 Expose the `dexie` instance
      insertActivity: execute(
        // Schema to validate the input data (e.g. non-empty string)
        Schema.Struct({ name: Schema.NonEmptyString }),

        // 👇 Execute query to add data with `dexie`
        ({ name }) => db.activity.add({ name })
      ),
    };
  }),
}) {}
