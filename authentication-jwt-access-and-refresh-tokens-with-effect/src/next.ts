import { Cookies } from "@effect/platform";
import { Effect } from "effect";
import { cookies } from "next/headers";
import { CookieToken } from "./cookie-token";

// Example of reading token from cookies using `cookies` from `next/headers`
const main = (nextCookies: Awaited<ReturnType<typeof cookies>>) =>
  Effect.gen(function* () {
    const cookieToken = yield* CookieToken;
    const [, cookieList] = yield* Effect.partition(
      nextCookies.getAll(),
      ({ name, value }) => Cookies.makeCookie(name, value)
    );

    const cookies = Cookies.fromIterable(cookieList);

    // Get the access token from `Cookies`
    return yield* cookieToken.get(cookies);
  }).pipe(Effect.provide(CookieToken.Default));

export default async function Page() {
  const nextCookies = await cookies();
  const token = await Effect.runPromise(main(nextCookies));
  // ...
}
