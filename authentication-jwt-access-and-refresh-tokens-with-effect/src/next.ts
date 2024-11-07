import { Cookies } from "@effect/platform";
import { Array, Effect, Record } from "effect";
import { cookies } from "next/headers";
import { CookieToken } from "./cookie-token";
import type { Token } from "./schema";

const nextCookiesToEffect = (
  nextCookies: Awaited<ReturnType<typeof cookies>>
) =>
  Effect.gen(function* () {
    // Keep only valid cookies
    const [, cookieList] = yield* Effect.partition(
      nextCookies.getAll(),
      ({ name, value }) => Cookies.makeCookie(name, value)
    );

    return Cookies.fromIterable(cookieList);
  });

// Example of reading token using `cookies` from `next/headers`
const main = (nextCookies: Awaited<ReturnType<typeof cookies>>) =>
  Effect.gen(function* () {
    const cookieToken = yield* CookieToken;
    const cookies = yield* nextCookiesToEffect(nextCookies);

    // 👇 Get the access token from `Cookies`
    return yield* cookieToken.get(cookies);
  }).pipe(Effect.provide(CookieToken.Default));

// Example of setting token using `cookies` from `next/headers`
const set = (
  newTokens: {
    accessToken: typeof Token.Type;
    refreshToken: typeof Token.Type;
  },
  nextCookies: Awaited<ReturnType<typeof cookies>>
) =>
  Effect.gen(function* () {
    const cookieToken = yield* CookieToken;
    const cookies = yield* nextCookiesToEffect(nextCookies);

    // 👇 Set the new tokens from `Cookies` to `nextCookies`
    (yield* cookieToken.set(newTokens)(cookies)).pipe(
      Cookies.toRecord,
      Record.toEntries,
      Array.forEach(([name, value]) => nextCookies.set(name, value))
    );
  }).pipe(Effect.provide(CookieToken.Default));

export default async function Page() {
  const nextCookies = await cookies();
  const token = await Effect.runPromise(main(nextCookies));
  // ...
}
