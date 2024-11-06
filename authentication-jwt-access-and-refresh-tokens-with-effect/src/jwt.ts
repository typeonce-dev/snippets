import { Clock, Data, Effect, flow } from "effect";
import { jwtDecode } from "jwt-decode";
import type { Token } from "./schema";

class JwtError extends Data.TaggedError("JwtError")<{
  reason: "decode-error" | "missing-exp";
  cause?: unknown;
}> {}

export class Jwt extends Effect.Service<Jwt>()("Jwt", {
  effect: Effect.gen(function* () {
    const decode = (token: typeof Token.Type) =>
      Effect.try({
        try: () => jwtDecode(token),
        catch: (error) =>
          new JwtError({ reason: "decode-error", cause: error }),
      });

    return {
      isExpired: flow(
        decode,
        Effect.flatMap(({ exp }) =>
          Effect.fromNullable(exp).pipe(
            Effect.mapError(() => new JwtError({ reason: "missing-exp" }))
          )
        ),
        Effect.flatMap((exp) =>
          Effect.gen(function* () {
            // `Clock` is included built-in in the default effect runtime
            const currentTime = yield* Clock.currentTimeMillis;

            // Convert `exp` to milliseconds (it's stored in seconds)
            return currentTime > exp * 1000;
          })
        )
      ),
    };
  }),
}) {}
