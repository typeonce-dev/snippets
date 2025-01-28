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
  accessors: true, // 👈 Enable accessors
  effect: Effect.gen(function* () {
    const db = new _Dexie.Dexie("_db") as _Dexie.Dexie & {
      // 👇 Extract table type from `Schema`
      activity: _Dexie.EntityTable<typeof ActivityTable.Encoded, "activityId">;

      // ⚡️ TODO: Add all tables here (make sure to define the schema in `schema.ts`)
    };

    db.version(1).stores({
      activity: "++activityId, &name",
    });

    // 👇 Action specific to decode `FormData`
    const formAction =
      <const R extends string, I, T>(
        source: Schema.Schema<I, Record<R, string>>,
        exec: (values: Readonly<I>) => Promise<T>
      ) =>
      (formData: FormData) =>
        // 1️⃣ Decode `FormData` to `Record<string, string>`
        Schema.decodeUnknown(source)(formDataToRecord(formData)).pipe(
          Effect.mapError((error) => new WriteApiError({ cause: error })),
          Effect.flatMap((values) =>
            Effect.tryPromise({
              // 2️⃣ Execute the query
              try: () => exec(values),
              catch: (error) => new WriteApiError({ cause: error }),
            })
          )
        );

    // 👇 Action for any data change
    const changeAction =
      <A, I, T>(
        source: Schema.Schema<A, I>,
        exec: (values: Readonly<A>) => Promise<T>
      ) =>
      (params: I) =>
        Schema.decode(source)(params).pipe(
          Effect.tap(Effect.log),
          Effect.mapError((error) => new WriteApiError({ cause: error })),
          Effect.flatMap((values) =>
            Effect.tryPromise({
              try: () => exec(values),
              catch: (error) => new WriteApiError({ cause: error }),
            })
          )
        );

    return {
      db, // 👈 Expose the `dexie` instance

      insertActivity: formAction(
        // Schema to validate the input data (e.g. non-empty string)
        Schema.Struct({ name: Schema.NonEmptyString }),

        // 👇 Execute query to add data with `dexie`
        ({ name }) => db.activity.add({ name })
      ),

      updateActivity: changeAction(
        Schema.Struct({
          activityId: Schema.NumberFromString.pipe(Schema.nonNegative()),
          name: Schema.NonEmptyString,
        }),

        // 👇 Execute query to update data with `dexie`
        ({ activityId, name }) => db.activity.update(activityId, { name })
      ),
    };
  }),
}) {}
