import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Effect, Layer } from "effect";

// 👇 Rpc API group shared between server and client
import { RpcAuth } from "./api";

const ProtocolLive = RpcClient.layerProtocolHttp({
  url: "/api/rpc",
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

export class RpcAuthClient extends Effect.Service<RpcAuthClient>()(
  "RpcAuthClient",
  {
    dependencies: [ProtocolLive],
    scoped: RpcClient.make(RpcAuth),
  }
) {}

/// 👇 Example of how to use `RpcAuthClient` to perform requests
const main = Effect.gen(function* () {
  const client = yield* RpcAuthClient;

  //   👇 `boolean` (as defined in `Rpc.make`)
  const response = yield* client
    .SignUpRequest({
      email: "test@test.com",
      password: "test",
    })
    .pipe(
      Effect.tapError(
        // 👇 `requestError` is the error type defined in `Rpc.make`
        (requestError) => Effect.log(requestError.errorMessage)
      )
    );
}).pipe(Effect.provide(RpcAuthClient.Default));

Effect.runPromise(main);
