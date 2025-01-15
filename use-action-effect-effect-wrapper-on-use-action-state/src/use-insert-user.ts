import {
  HttpBody,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { useActionEffect } from "./use-action-effect";

export const useInsertUser = () => {
  // 👇 Same return as `useActionState`
  const [error, action, pending] = useActionEffect((fromData) =>
    Effect.gen(function* () {
      const baseClient = yield* HttpClient.HttpClient;

      const request = HttpClientRequest.post("/user/insert").pipe(
        HttpClientRequest.bodyFormData(
          // 👇 `HttpBody.formData` to create a `FormData` body
          HttpBody.formData(fromData)
        )
      );

      const response = yield* baseClient.execute(request).pipe(
        Effect.flatMap(
          // 👇 `HttpClientResponse.schemaBodyJson` to parse the response body
          HttpClientResponse.schemaBodyJson(
            Schema.Struct({ id: Schema.String })
          )
        ),
        Effect.scoped
      );

      // 💁🏼‍♂️ This return value is not used with this implementation
      return response.id;
    })
  );

  return [error, action, pending]; // 👈 Return what you need
};
