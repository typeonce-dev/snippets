import { Effect, Layer } from "effect";
import { cookies } from "next/headers";
import { CookieToken } from "./cookie-token";
import { Cookies } from "./cookies";
import type { Token } from "./schema";

const provideCookies = (nextCookies: Awaited<ReturnType<typeof cookies>>) =>
  Effect.provide(
    // 👇 Provide `Cookies` layer from `next/headers`
    CookieToken.Default.pipe(Layer.provide(Cookies.NextCookies(nextCookies)))
  );

// Example of reading token using `cookies` from `next/headers`
const main = (nextCookies: Awaited<ReturnType<typeof cookies>>) =>
  Effect.gen(function* () {
    const cookieToken = yield* CookieToken;

    // 👇 Get the access token from `Cookies`
    return yield* cookieToken.get;
  }).pipe(provideCookies(nextCookies));

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

    // 👇 Set the new tokens from `Cookies`
    return yield* cookieToken.set(newTokens);
  }).pipe(provideCookies(nextCookies));

export default async function Page() {
  // ⚠️ Important: `cookies` must be called outside `Effect` (quirks of Next.js 💁🏼‍♂️)
  const nextCookies = await cookies();
  const token = await Effect.runPromise(main(nextCookies));
  // ...
}
