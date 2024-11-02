import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
} from "@effect/platform";
import { RpcResolver } from "@effect/rpc";
import { HttpRpcResolverNoStream } from "@effect/rpc-http";
import { Effect, flow } from "effect";

// 👇 API derived from `Router` defined in the server
import { SignUpRequest } from "./schema";
import type { Router } from "./server";

export class RpcClient extends Effect.Service<RpcClient>()("RpcClient", {
  effect: Effect.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;
    const client = baseClient.pipe(
      HttpClient.mapRequest(
        // 👇 Rpc endpoint as `POST` pointing to a single API endpoint
        flow(
          HttpClientRequest.prependUrl("/api/rpc"),
          HttpClientRequest.setMethod("POST")
        )
      )
    );

    return HttpRpcResolverNoStream.make<Router>(client).pipe(
      RpcResolver.toClient
    );
  }),
  dependencies: [FetchHttpClient.layer],
}) {}

/// 👇 Example of how to use `RpcClient` to perform requests
const main = Effect.gen(function* () {
  const rpcClient = yield* RpcClient;

  //   👇 `boolean`
  const response = yield* rpcClient(
    new SignUpRequest({
      email: "test@test.com",
      password: "test",
    })
  ).pipe(
    Effect.tapError((requestError) => Effect.log(requestError.errorMessage))
  );
});
