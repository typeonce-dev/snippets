import {
  Cookies,
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import {
  Config,
  Context,
  Data,
  Effect,
  Either,
  flow,
  Function,
  Layer,
  Option,
  Schema,
} from "effect";
import { Jwt } from "./jwt";
import { Token } from "./schema";

class CookieTokenError extends Data.TaggedError("CookieTokenError")<{
  reason: "invalid-token" | "refresh-error";
  cause?: unknown;
}> {}

export class CookieTokenKey extends Context.Tag("CookieTokenKey")<
  CookieTokenKey,
  { tokenKey: string }
>() {
  static readonly Refresh = Layer.succeed(this, { tokenKey: "refresh-token" });
  static readonly Access = Layer.succeed(this, { tokenKey: "access-token" });
}

const make = Effect.gen(function* () {
  const { tokenKey } = yield* CookieTokenKey;
  return {
    remove: Cookies.remove(tokenKey),
    get: flow(
      Cookies.get(tokenKey),
      Option.flatMap((cookie) => Schema.decodeOption(Token)(cookie.value)),
      Either.fromOption(() => new CookieTokenError({ reason: "invalid-token" }))
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

class AccessTokenCookie extends Context.Tag("AccessTokenCookie")<
  AccessTokenCookie,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Default = Layer.effect(this, make).pipe(
    Layer.provide(CookieTokenKey.Access)
  );
}

class RefreshTokenCookie extends Context.Tag("RefreshTokenCookie")<
  RefreshTokenCookie,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Default = Layer.effect(this, make).pipe(
    Layer.provide(CookieTokenKey.Refresh)
  );
}

export class CookieToken extends Effect.Service<CookieToken>()("CookieToken", {
  effect: Effect.gen(function* () {
    const jwt = yield* Jwt;
    const accessTokenCookie = yield* AccessTokenCookie;
    const refreshTokenCookie = yield* RefreshTokenCookie;

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
          accessTokenCookie.set(newTokens.accessToken)(cookies),
          refreshTokenCookie.set(newTokens.refreshToken)(cookies),
        ]);

        return newTokens;
      });

    return {
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
        }),

      set:
        ({
          accessToken,
          refreshToken,
        }: {
          accessToken: typeof Token.Type;
          refreshToken: typeof Token.Type;
        }) =>
        (cookies: Cookies.Cookies) =>
          Effect.all([
            accessTokenCookie.set(accessToken)(cookies),
            refreshTokenCookie.set(refreshToken)(cookies),
          ]).pipe(Effect.map(Function.constVoid)),

      remove: (cookies: Cookies.Cookies) => {
        accessTokenCookie.remove(cookies);
        refreshTokenCookie.remove(cookies);
      },
    };
  }),
  dependencies: [
    Jwt.Default,
    AccessTokenCookie.Default,
    RefreshTokenCookie.Default,
    FetchHttpClient.layer,
  ],
}) {}
