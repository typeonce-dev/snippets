import { HtmlChangeEvent } from "./HtmlChangeEvent";

import { Effect } from "effect";
import { assign, fromPromise, setup } from "xstate";

export const machine = setup({
  types: {
    context: {} as {
      file: globalThis.File | null;
      submitError: unknown | null;
    },
    events: {} as Readonly<{
      type: "upload-file";
      event: React.ChangeEvent<HTMLInputElement>;
    }>,
  },
  actors: {
    uploadFile: fromPromise<
      globalThis.File,
      { event: React.ChangeEvent<HTMLInputElement> }
    >(({ input: { event } }) =>
      Effect.runPromise(
        HtmlChangeEvent.getRequiredFile.pipe(
          Effect.provide(HtmlChangeEvent.fromEvent(event))
        )
      )
    ),
  },
}).createMachine({
  id: "upload-file-machine",
  context: { file: null, submitError: null },
  initial: "Idle",
  states: {
    Idle: {
      on: {
        "upload-file": {
          target: "Uploading",
        },
      },
    },
    Uploading: {
      invoke: {
        src: "uploadFile",
        input: ({ event }) => ({ event: event.event }),
        onError: {
          target: "Idle",
          actions: assign(({ event }) => ({
            submitError: event.error,
          })),
        },
        onDone: {
          target: "Uploaded",
          actions: assign(({ event }) => ({ file: event.output })),
        },
      },
    },
    Uploaded: {
      on: {
        "upload-file": {
          target: "Uploading",
        },
      },
    },
  },
});
