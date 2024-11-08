import { ConfigProvider, Layer, ManagedRuntime } from "effect";
import { Stripe } from "./stripe";

const CustomConfigProvider = Layer.setConfigProvider(
  // 👇 Provide `Config` for `Stripe` service
  ConfigProvider.fromMap(
    new Map([
      [
        "PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "", // TODO
      ],
    ])
  )
);

const MainLayerLive = Layer.mergeAll(Stripe.Default).pipe(
  // 👇 Provide config provider with `Config` values
  Layer.provide(CustomConfigProvider)
);

export const RuntimeClient = ManagedRuntime.make(MainLayerLive);
