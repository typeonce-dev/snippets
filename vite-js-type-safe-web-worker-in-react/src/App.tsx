import { useEffect, useRef } from "react";
import type { WorkerMessage, WorkerResponse } from "./types";

export default function App() {
  const worker = useRef<Worker | null>(null);

  // Send message to worker (type-safe from `WorkerMessage`)
  const sendMessage = () => {
    if (worker.current) {
      worker.current.postMessage({
        type: "feed.get",
        source: "https://www.sandromaglione.com/feed",
      } satisfies WorkerMessage);
    }
  };

  useEffect(() => {
    const url = new URL("./feed.ts", import.meta.url);
    const newWorker = new Worker(url, { type: "module" });

    // Handle all possible messages (type-safe from `WorkerResponse`)
    newWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === "feed.get") {
        // Received message from worker (type-safe) ✨
      }
    };

    newWorker.onerror = (error: ErrorEvent) => {
      // Handle error from worker (`ErrorEvent`)
    };

    worker.current = newWorker;

    return () => {
      // Clean up worker when component unmounts
      newWorker.terminate();
    };
  }, []);

  return (
    <button type="button" onClick={sendMessage}>
      Send
    </button>
  );
}
