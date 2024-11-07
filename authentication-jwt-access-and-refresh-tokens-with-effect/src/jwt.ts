import { Clock, Data, Effect, flow } from "effect";
import { jwtDecode } from "jwt-decode";
import type { Token } from "./schema";

class JwtInvalid extends Data.TaggedError("JwtInvalid")<{
  reason: "decode-error" | "missing-exp";
  cause?: unknown;
}> {}

export class Jwt extends Effect.Service<Jwt>()("Jwt", {
  effect: Effect.gen(function* () {
    const decode = (token: typeof Token.Type) =>
      Effect.try({
        try: () => jwtDecode(token),
        catch: (error) =>
          new JwtInvalid({ reason: "decode-error", cause: error }),
      });

    return {
      decode,
      isExpired: flow(
        decode,
        Effect.flatMap(({ exp }) =>
          Effect.fromNullable(exp).pipe(
            Effect.mapError(() => new JwtInvalid({ reason: "missing-exp" }))
          )
        ),
        Effect.flatMap((exp) =>
          Effect.gen(function* () {
            const currentTime = yield* Clock.currentTimeMillis;
            return currentTime > exp * 1000;
          })
        )
      ),
    };
  }),
}) {}
