import { Effect, Function, type ManagedRuntime } from "effect";
import { useActionState } from "react";
import { CustomRuntime } from "./custom-runtime";

export const useActionEffect = <A, E>(
  effect: (formData: FormData) => Effect.Effect<
    A,
    E,
    // 👇 All services from `CustomRuntime` are included
    ManagedRuntime.ManagedRuntime.Context<typeof CustomRuntime>
  >
) => {
  return useActionState(
    // 👇 Expected errors extracted inside the hook state (`E | null`)
    (_: E | null, formData: FormData) =>
      CustomRuntime.runPromise(
        effect(formData).pipe(
          Effect.match({
            onFailure: Function.identity,
            onSuccess: Function.constNull,
          })
        )
      ),
    null
  );
};
