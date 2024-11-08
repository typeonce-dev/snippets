import {
  AddressElement,
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useMachine, useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import { machine } from "./machine";

export default function Page({ clientSecret }: { clientSecret: string }) {
  const [snapshot, send, actor] = useMachine(machine, {
    // 👇 `clientSecret` should be fetched from the server (required)
    input: { clientSecret },
  });

  return snapshot.matches("LoadingError") ? (
    <button type="button" onClick={() => send({ type: "stripe.reload" })}>
      Reload
    </button>
  ) : snapshot.matches("Loading") ? (
    <p>Loading</p>
  ) : (
    // 👇 Using `Elements` component from `@stripe/react-stripe-js`
    <Elements
      stripe={snapshot.context.stripe}
      options={snapshot.context.options}
    >
      <StripeCheckoutForm actor={actor} />
    </Elements>
  );
}

function StripeCheckoutForm({
  actor,
}: {
  actor: ActorRefFrom<typeof machine>;
}) {
  const stripe = useStripe();
  const elements = useElements();

  // 👇 Extract machine state from the actor
  const { isLoading, stripeError } = useSelector(actor, (snapshot) => ({
    isLoading: snapshot.matches("Submitting"),
    stripeError: snapshot.context.stripeError,
  }));

  return (
    <form
      onSubmit={(event) =>
        actor.send({ type: "stripe.submit", event, elements })
      }
    >
      {/* 👇 List elements that you want to collect in your payment form */}
      <AddressElement options={{ mode: "billing" }} />
      <PaymentElement />

      <div>
        <button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? "Submitting..." : "Continue"}
        </button>

        {stripeError && <span>{stripeError}</span>}
      </div>
    </form>
  );
}
