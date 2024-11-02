// 👇 These are the `paths` generated from the OpenAPI schema
import type { paths } from "./schema.d.ts";

import { Config, Context, Data, Effect, Layer, Schema } from "effect";

// 👇 This is the client generator
import createClient from "openapi-fetch";

interface ClientConfig {
  readonly baseUrl: string;
}

export class ClientError extends Data.TaggedError("ClientError")<{
  reason: "RequestError" | "ParseError";
  error?: unknown;
}> {}

// 👇 The service is generic on any `paths` type
const make = <Paths extends {}>(config: ClientConfig) =>
  Effect.gen(function* () {
    const client = createClient<Paths>({ baseUrl: config.baseUrl });

    const request =
      <I>(
        request: (ref: typeof client) => Promise<{
          data?: I;
          error?: unknown;
          response: globalThis.Response;
        }>
      ) =>
      <A>(schema: Schema.Schema<A, I>): Effect.Effect<A, ClientError> =>
        Effect.async<I, ClientError>((cb) => {
          void request(client).then(({ data, error }) => {
            if (error !== undefined) {
              return cb(
                Effect.fail(new ClientError({ error, reason: "RequestError" }))
              );
            }

            // ℹ️ This assumes that when `error` is undefined, `data` is defined
            return cb(Effect.succeed(data!));
          });
        }).pipe(
          Effect.flatMap(Schema.decode(schema)),
          Effect.catchTag("ParseError", (error) =>
            Effect.fail(new ClientError({ error, reason: "ParseError" }))
          )
        );

    return { client, request };
  });

const clientFactory = <Paths extends {}>(id: string) =>
  class Client extends Context.Tag(id)<
    Client,
    Effect.Effect.Success<ReturnType<typeof make<Paths>>>
  >() {
    static readonly layer = (config: Config.Config.Wrap<ClientConfig>) =>
      Config.unwrap(config).pipe(
        Effect.flatMap(make<Paths>),
        Layer.effect(this)
      );
  };

// 👇 You can generate as many clients as you want from the same generic service (with different `paths`)
export const OpenApiClient = clientFactory<paths>("OpenApiClient");
