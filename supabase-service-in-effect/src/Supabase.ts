import * as _Supabase from "@supabase/supabase-js";
import { Config, Context, Data, Effect, Layer, Redacted } from "effect";
import type { Database } from "./database"; // 👈 Generated types

interface SupabaseConfig {
  readonly url: string;
  readonly key: Redacted.Redacted;
}

class SupabaseError extends Data.TaggedError("SupabaseError")<
  Readonly<{
    error: _Supabase.PostgrestError;
  }>
> {}

const make = ({ key, url }: SupabaseConfig) =>
  Effect.gen(function* (_) {
    const client = yield* Effect.sync(() =>
      _Supabase.createClient<Database>(url, Redacted.value(key))
    );

    const query = <A>(
      body: (
        _: typeof client
      ) => PromiseLike<_Supabase.PostgrestSingleResponse<A>>
    ) =>
      Effect.async<A, SupabaseError, never>((cb) => {
        body(client).then(({ data, error }) => {
          if (error) {
            cb(Effect.fail(new SupabaseError({ error })));
          } else {
            cb(Effect.succeed(data));
          }
        });
      });

    return { query, client };
  });

export class Supabase extends Context.Tag("Supabase")<
  Supabase,
  Effect.Effect.Success<ReturnType<typeof make>>
>() {
  static readonly Live = (config: Config.Config.Wrap<SupabaseConfig>) =>
    Config.unwrap(config).pipe(
      Effect.flatMap(make),
      Layer.effect(this),
      Layer.orDie
    );
}
