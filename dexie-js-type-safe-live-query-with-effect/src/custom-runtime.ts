import { Layer, ManagedRuntime } from "effect";
import { Dexie } from "./dexie";

// 👇 Use `Layer.mergeAll` to add layers to `CustomRuntime`
const MainLayer = Layer.mergeAll(Dexie.Default);

export const CustomRuntime = ManagedRuntime.make(MainLayer);
