import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Config, Data, Effect, flow, Function, Schema } from "effect";
import { Cookies } from "./cookies";
import { Jwt } from "./jwt";
import { Token } from "./schema";

class CookieTokenError extends Data.TaggedError("CookieTokenError")<{
  reason: "invalid-token" | "refresh-error" | "missing-token";
  cause?: unknown;
}> {}

const make = (tokenKey: string) =>
  Effect.gen(function* () {
    const cookies = yield* Cookies;
    return {
      remove: cookies.remove(tokenKey),

      get: cookies.get(tokenKey).pipe(
        Effect.flatMap(
          flow(
            Effect.fromNullable,
            Effect.mapError(
              () => new CookieTokenError({ reason: "missing-token" })
            )
          )
        ),
        Effect.flatMap(
          flow(
            Schema.decodeOption(Token),
            Effect.mapError(
              () => new CookieTokenError({ reason: "invalid-token" })
            )
          )
        )
      ),

      set: (value: typeof Token.Type) =>
        cookies
          .set(tokenKey, value)
          .pipe(
            Effect.mapError(
              (cause) =>
                new CookieTokenError({ reason: "invalid-token", cause })
            )
          ),
    };
  });

class AccessTokenCookie extends Effect.Service<AccessTokenCookie>()(
  "AccessTokenCookie",
  { accessors: true, effect: make("access-token") }
) {}

class RefreshTokenCookie extends Effect.Service<RefreshTokenCookie>()(
  "RefreshTokenCookie",
  { accessors: true, effect: make("refresh-token") }
) {}

export class CookieToken extends Effect.Service<CookieToken>()("CookieToken", {
  effect: Effect.gen(function* () {
    const jwt = yield* Jwt;
    const accessTokenCookie = yield* AccessTokenCookie;
    const refreshTokenCookie = yield* RefreshTokenCookie;

    // 👇 `HttpClient` to request updated tokens (using the refresh token)
    const baseUrl = yield* Config.string("API_BASE_URL");
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(
        flow(
          HttpClientRequest.acceptJson,
          HttpClientRequest.prependUrl(baseUrl)
        )
      )
    );

    const refresh = Effect.gen(function* () {
      const refreshToken = yield* refreshTokenCookie.get;

      const request = yield* HttpClientRequest.post(
        // 👇 Endpoint to refresh the access token
        "/authentication/refresh-access-token"
      ).pipe(
        HttpClientRequest.schemaBodyJson(
          Schema.Struct({ refreshToken: Schema.NonEmptyString })
        )({ refreshToken }),
        Effect.mapError(
          (cause) => new CookieTokenError({ reason: "invalid-token", cause })
        )
      );

      const newTokens = yield* client.execute(request).pipe(
        Effect.flatMap(
          HttpClientResponse.schemaBodyJson(
            Schema.Struct({ accessToken: Token, refreshToken: Token })
          )
        ),
        Effect.mapError(
          (cause) => new CookieTokenError({ reason: "invalid-token", cause })
        ),
        Effect.scoped
      );

      yield* Effect.all([
        accessTokenCookie.set(newTokens.accessToken),
        refreshTokenCookie.set(newTokens.refreshToken),
      ]);

      return newTokens;
    });

    const remove = Effect.all([
      accessTokenCookie.remove,
      refreshTokenCookie.remove,
    ]).pipe(Effect.map(Function.constVoid));

    return {
      remove,

      get: Effect.gen(function* () {
        const accessToken = yield* accessTokenCookie.get;
        const isExpired = yield* jwt.isExpired(accessToken);

        if (!isExpired) {
          return accessToken;
        } else {
          const newTokens = yield* refresh;
          return newTokens.accessToken;
        }
      }).pipe(
        // ⚠️ If the token is invalid, remove the cookies
        Effect.tapErrorTag("JwtInvalid", () => remove)
      ),

      set: (newTokens: {
        accessToken: typeof Token.Type;
        refreshToken: typeof Token.Type;
      }) =>
        Effect.all([
          accessTokenCookie.set(newTokens.accessToken),
          refreshTokenCookie.set(newTokens.refreshToken),
        ]).pipe(Effect.map(Function.constVoid)),
    };
  }),

  dependencies: [
    Jwt.Default,
    FetchHttpClient.layer,
    AccessTokenCookie.Default,
    RefreshTokenCookie.Default,
  ],
}) {}
