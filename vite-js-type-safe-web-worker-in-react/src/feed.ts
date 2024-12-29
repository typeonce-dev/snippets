import type { WorkerMessage, WorkerResponse } from "./types";

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type === "feed.get") {
    const response = await fetch(event.data.source);
    const text = await response.text();

    // Send message back to main thread (type-safe from `WorkerResponse`)
    self.postMessage({ type: "feed.get", text } satisfies WorkerResponse);
  }
};
