import { Schema } from "effect";

class RequestError extends Schema.Class<RequestError>("RequestError")({
  errorMessage: Schema.String,
}) {}

export class SignUpRequest extends Schema.TaggedRequest<SignUpRequest>()(
  "SignUpRequest",
  {
    failure: RequestError,
    success: Schema.Boolean,
    payload: {
      email: Schema.NonEmptyString,
      password: Schema.String,
    },
  }
) {}
