import { Effect, Layer, Logger, LogLevel, RequestResolver } from "effect";
import { OpenApiClient } from "./Client";
import { GetUserByUsername } from "./requests";

const make = Effect.map(OpenApiClient, ({ request }) => ({
  // 👇 All the parameters are type-safe, the schema definition must conform to the OpenAPI schema
  getUserByUsername: RequestResolver.fromEffect((path: GetUserByUsername) =>
    request((client) =>
      client.GET(GetUserByUsername.path, {
        params: { path },
      })
    )(GetUserByUsername.schema)
  ),
}));

export class Api extends Effect.Tag("Api")<
  Api,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Live = Layer.effect(this, make);

  // 👇 Inject `Mock` layer for local development testing
  static readonly Mock = make.pipe(
    Effect.map((live): typeof live => ({
      ...live,

      // 👇 Mock request
      getUserByUsername: RequestResolver.fromEffect((params) =>
        Effect.gen(function* () {
          yield* Effect.logDebug(params);
          return { username: "", uuid: "" };
        }).pipe(Logger.withMinimumLogLevel(LogLevel.All))
      ),
    })),
    Layer.effect(this)
  );
}
