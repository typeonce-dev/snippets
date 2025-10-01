/// <reference lib="webworker" />
import { OpfsWorker } from "@effect/sql-sqlite-wasm";
import { Effect } from "effect";

Effect.runFork(OpfsWorker.run({ port: self, dbName: "sync.sqlite" }));
