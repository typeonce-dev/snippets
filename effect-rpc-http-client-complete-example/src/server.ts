import { HttpApp } from "@effect/platform";
import { Rpc, RpcRouter } from "@effect/rpc";
import { HttpRpcRouterNoStream } from "@effect/rpc-http";
import { Effect, Logger } from "effect";
import { SignUpRequest } from "./schema";

// 👇 Example of added custom logger (as `Layer`)
export const LoggerLayer = Logger.add(
  Logger.make(({ logLevel, message }) => {
    globalThis.console.log(`[${logLevel.label}] ${message}`);
  })
);

const router = RpcRouter.make(
  Rpc.effect(SignUpRequest, (params) =>
    Effect.gen(function* () {
      // 👇 `params` contains the `TaggedRequest` payload
      yield* Effect.log(params.email, params.password);
      return true;
    })
  )
);

// 👇 Export `Router` type for client generation
export type Router = typeof router;

export const RpcWebHandler = HttpApp.toWebHandlerLayer(
  HttpRpcRouterNoStream.toHttpApp(router),
  // 👇 Provide layers used in requests
  LoggerLayer
);
