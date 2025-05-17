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
  const [{ error, data }, action, pending] = useActionEffect(
    (formData: FormData) =>
      Effect.gen(function* () {
        const baseClient = yield* HttpClient.HttpClient;

        const request = HttpClientRequest.post("/user/insert").pipe(
          HttpClientRequest.bodyFormData(
            // 👇 `HttpBody.formData` to create a `FormData` body
            HttpBody.formData(formData)
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

        // 💡 Type of `data` inferred from return value
        return response.id;
      })
  );

  // 👉 `error: HttpClientError | ParseError | null`
  // 👉 `data: string | null`
  //
  // 👉 `action: (payload: FormData) => void`
  return [error, action, pending, data] as const;
};
