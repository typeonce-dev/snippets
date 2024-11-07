import { Effect, Layer } from "effect";
import type { cookies } from "next/headers";

export class Cookies extends Effect.Tag("Cookies")<
  Cookies,
  {
    get: (name: string) => Effect.Effect<string | undefined>;
    set: (name: string, value: string) => Effect.Effect<void>;
    remove: (name: string) => Effect.Effect<void>;
  }
>() {
  static readonly NextCookies = (
    nextCookies: Awaited<ReturnType<typeof cookies>>
  ) =>
    Layer.succeed(
      this,
      this.of({
        get: (name) => Effect.sync(() => nextCookies.get(name)?.value),
        set: (name, value) => Effect.sync(() => nextCookies.set(name, value)),
        remove: (name) => Effect.sync(() => nextCookies.delete(name)),
      })
    );
}
