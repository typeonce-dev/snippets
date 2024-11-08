import { loadStripe } from "@stripe/stripe-js";
import { Config, Data, Effect } from "effect";

class StripeError extends Data.TaggedError("StripeError")<{
  cause: unknown;
}> {}

export class Stripe extends Effect.Service<Stripe>()("Stripe", {
  effect: Effect.gen(function* () {
    const publishableKey = yield* Config.string(
      "PUBLIC_STRIPE_PUBLISHABLE_KEY"
    );

    // 👇 Load Stripe using `loadStripe` from `@stripe/stripe-js`
    return yield* Effect.tryPromise(() => loadStripe(publishableKey)).pipe(
      Effect.flatMap(Effect.fromNullable),
      Effect.mapError((error) => new StripeError({ cause: error }))
    );
  }),
}) {}
