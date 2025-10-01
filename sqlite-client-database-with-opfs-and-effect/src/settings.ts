import { SqlClient } from "@effect/sql";
import { Effect } from "effect";
import { SqlLive } from "./sql";

// 👇 Example service using `SqlClient`
export class Settings extends Effect.Service<Settings>()("Settings", {
  dependencies: [SqlLive],
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    return {
      get: sql<{ json: string }>`SELECT json FROM settings`,
    };
  }),
}) {}
