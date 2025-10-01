import { Migrator, SqlClient } from "@effect/sql";
import * as SqliteClient from "@effect/sql-sqlite-wasm/SqliteClient";
import * as SqliteMigrator from "@effect/sql-sqlite-wasm/SqliteMigrator";
import { Effect, Layer } from "effect";

// `?worker` to import as a module (`vite`)
import SqlWorker from "./worker?worker";

const ClientLive = SqliteClient.layer({
  worker: Effect.acquireRelease(
    Effect.sync(() => new SqlWorker()),
    (worker) => Effect.sync(() => worker.terminate())
  ),
});

export const SqlLive = SqliteMigrator.layer({
  loader: Migrator.fromRecord({
    "0001_create_tables": Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      yield* sql`
        CREATE TABLE settings (
          name TEXT PRIMARY KEY,
          json TEXT NOT NULL
        )
      `;

      yield* sql`INSERT INTO settings ${sql.insert([
        {
          name: "example",
          json: JSON.stringify({}),
        },
      ])}`;
    }),
  } satisfies Record<`${number}_${string}`, any>),
}).pipe(Layer.provideMerge(ClientLive));
