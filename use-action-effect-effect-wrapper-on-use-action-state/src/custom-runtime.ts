import { Layer, ManagedRuntime } from "effect";

// 👇 Use `Layer.mergeAll` to add layers to `CustomRuntime`
// const MainLayer = Layer.mergeAll(/* layers */);
const MainLayer = Layer.empty;

export const CustomRuntime = ManagedRuntime.make(MainLayer);
