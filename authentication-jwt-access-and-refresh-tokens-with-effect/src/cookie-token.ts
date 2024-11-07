import {
  Cookies,
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Config, Data, Effect, Either, flow, Option, Schema } from "effect";
import { Jwt } from "./jwt";
import { Token } from "./schema";

class CookieTokenError extends Data.TaggedError("CookieTokenError")<{
  reason: "invalid-token" | "refresh-error";
  cause?: unknown;
}> {}

const make = (tokenKey: string) =>
  Effect.gen(function* () {
    return {
      remove: Cookies.remove(tokenKey),

      get: flow(
        Cookies.get(tokenKey),
        Option.flatMap((cookie) => Schema.decodeOption(Token)(cookie.value)),
        Either.fromOption(
          () => new CookieTokenError({ reason: "invalid-token" })
        )
      ),

      set: (value: typeof Token.Type) =>
        flow(
          Cookies.set(tokenKey, value),
          Either.mapLeft(
            (cause) => new CookieTokenError({ reason: "invalid-token", cause })
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

    const refresh = (cookies: Cookies.Cookies) =>
      Effect.gen(function* () {
        const refreshToken = yield* refreshTokenCookie.get(cookies);

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

        yield* accessTokenCookie
          .set(newTokens.accessToken)(cookies)
          .pipe(
            Either.andThen(
              refreshTokenCookie.set(newTokens.refreshToken)(cookies)
            )
          );

        return newTokens;
      });

    const remove = (cookies: Cookies.Cookies) =>
      Effect.sync(() =>
        accessTokenCookie.remove(cookies).pipe(refreshTokenCookie.remove)
      );

    return {
      remove,

      get: (cookies: Cookies.Cookies) =>
        Effect.gen(function* () {
          const accessToken = yield* accessTokenCookie.get(cookies);
          const isExpired = yield* jwt.isExpired(accessToken);

          if (!isExpired) {
            return accessToken;
          } else {
            const newTokens = yield* refresh(cookies);
            return newTokens.accessToken;
          }
        }).pipe(
          // ⚠️ If the token is invalid, remove the cookies
          Effect.tapErrorTag("JwtInvalid", () => remove(cookies))
        ),

      set: (newTokens: {
        accessToken: typeof Token.Type;
        refreshToken: typeof Token.Type;
      }) =>
        flow(
          accessTokenCookie.set(newTokens.accessToken),
          Either.andThen(refreshTokenCookie.set(newTokens.refreshToken))
        ),
    };
  }),
  dependencies: [
    Jwt.Default,
    AccessTokenCookie.Default,
    RefreshTokenCookie.Default,
    FetchHttpClient.layer,
  ],
}) {}
