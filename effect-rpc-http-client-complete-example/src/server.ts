import { HttpApp } from "@effect/platform";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Effect, Layer, Logger } from "effect";
import { RpcAuth } from "./api";

// 👇 Example of added custom logger (as `Layer`)
export const LoggerLayer = Logger.add(
  Logger.make(({ logLevel, message }) => {
    globalThis.console.log(`[${logLevel.label}] ${message}`);
  })
);

const RpcAuthLayer = RpcAuth.toLayer({
  SignUpRequest: (params) =>
    Effect.gen(function* () {
      // 👇 `params` contains the payload defined in `Rpc.make`
      yield* Effect.log(params.email, params.password);
      return true;
    }),
}).pipe(Layer.provide(LoggerLayer));

export const RpcWebHandler = RpcServer.toHttpApp(RpcAuth).pipe(
  // 👇 Convert to `Request`/`Response` handler
  Effect.map(HttpApp.toWebHandler),
  Effect.provide([RpcAuthLayer, RpcSerialization.layerNdjson])
);
