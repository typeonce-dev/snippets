import { Effect, type ManagedRuntime } from "effect";
import { useActionState } from "react";
import { CustomRuntime } from "./custom-runtime";

export const useActionEffect = <Payload, A, E>(
  effect: (payload: Payload) => Effect.Effect<
    A,
    E,
    // 👇 All services from `CustomRuntime` are included
    ManagedRuntime.ManagedRuntime.Context<typeof CustomRuntime>
  >
) => {
  return useActionState<
    | { error: E; data: null } // Expected errors (`E | null`)
    | { error: null; data: A } // Success data (`A | null`)
    | { error: null; data: null }, // Default state
    Payload
  >(
    (_, payload) =>
      CustomRuntime.runPromise(
        effect(payload).pipe(
          Effect.match({
            onFailure: (error) => ({ error, data: null }),
            onSuccess: (data) => ({ error: null, data }),
          })
        )
      ),
    { error: null, data: null }
  );
};
