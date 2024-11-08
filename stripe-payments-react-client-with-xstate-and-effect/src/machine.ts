import type { StripeElements } from "@stripe/stripe-js";
import { Effect, type Context } from "effect";
import { assertEvent, assign, fromPromise, setup } from "xstate";
import { RuntimeClient } from "./runtime-client";
import { Stripe } from "./stripe";

// 👉 Link to testing cards: https://docs.stripe.com/testing#cards
export const machine = setup({
  types: {
    input: {} as { clientSecret: string },
    events: {} as
      | { type: "stripe.reload" }
      | {
          type: "stripe.submit";
          event: React.FormEvent<HTMLFormElement>;
          elements: StripeElements | null;
        },
    context: {} as {
      options: { clientSecret: string };
      stripe: Context.Tag.Service<typeof Stripe> | null;
      stripeError: string | null;
    },
  },
  actors: {
    loadStripe: fromPromise(() => RuntimeClient.runPromise(Stripe)),
    confirmPayment: fromPromise(
      ({
        input: { elements, stripe },
      }: {
        input: {
          stripe: Context.Tag.Service<typeof Stripe> | null;
          elements: StripeElements | null;
        };
      }) =>
        RuntimeClient.runPromise(
          Effect.gen(function* () {
            if (stripe === null || elements === null) {
              return yield* Effect.fail("Stripe not loaded");
            }

            const { error } = yield* Effect.tryPromise({
              try: () =>
                stripe.confirmPayment({
                  elements,
                  confirmParams: {
                    return_url: "/complete", // TODO
                  },
                }),
              catch: () => "Payment failed, please try again",
            });

            return yield* Effect.fail(error.message ?? "Unknown error");
          })
        )
    ),
  },
}).createMachine({
  id: "stripe-elements-machine",
  context: ({ input }) => ({
    options: { clientSecret: input.clientSecret },
    stripe: null,
    stripeError: null,
  }),
  initial: "Loading",
  states: {
    Loading: {
      invoke: {
        src: "loadStripe",
        onError: { target: "LoadingError" },
        onDone: {
          target: "Idle",
          actions: assign(({ event }) => ({
            stripe: event.output,
          })),
        },
      },
    },
    Idle: {
      always: {
        target: "Loading",
        // 👇 Only allow `Idle` state if `Stripe` is loaded
        guard: ({ context }) => context.stripe === null,
      },
      on: {
        "stripe.submit": {
          target: "Submitting",
          actions: assign({ stripeError: null }),
        },
      },
    },
    Submitting: {
      invoke: {
        src: "confirmPayment",
        input: ({ event, context }) => {
          assertEvent(event, "stripe.submit");
          event.event.preventDefault();
          return {
            elements: event.elements,
            stripe: context.stripe,
          };
        },
        onError: {
          target: "Idle",
          actions: assign(({ event }) => ({
            stripeError: String(
              // 👇 Report errors from Stripe
              event.error instanceof Error ? event.error.message : event.error
            ),
          })),
        },
        onDone: {
          target: "Complete",
        },
      },
    },
    LoadingError: {
      on: {
        "stripe.reload": {
          target: "Loading",
          actions: assign({ stripeError: null }),
        },
      },
    },
    Complete: {
      type: "final",
    },
  },
});
