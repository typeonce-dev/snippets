import { FetchHttpClient } from "@effect/platform";
import { Layer, ManagedRuntime } from "effect";

// 👇 Use `Layer.mergeAll` to add layers to `CustomRuntime`
const MainLayer = Layer.mergeAll(FetchHttpClient.layer);

export const CustomRuntime = ManagedRuntime.make(MainLayer);
