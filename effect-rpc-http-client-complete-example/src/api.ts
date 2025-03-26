import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

class RequestError extends Schema.Class<RequestError>("RequestError")({
  errorMessage: Schema.String,
}) {}

// 👇 Rpc API group shared between server and client
export class RpcAuth extends RpcGroup.make(
  Rpc.make("SignUpRequest", {
    error: RequestError,
    success: Schema.Boolean,
    payload: {
      email: Schema.NonEmptyString,
      password: Schema.String,
    },
  })
) {}
