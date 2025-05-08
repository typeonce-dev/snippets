import { Effect } from "effect";
import {
  assertEvent,
  assign,
  fromPromise,
  sendTo,
  setup,
  type AnyActorRef,
} from "xstate";

/** Events shared with the parent */
export type UploadFileEvent =
  | { type: "file.upload"; fileUrl: string }
  | { type: "file.remove" };

export const machine = setup({
  types: {
    /** The parent sends a reference to itself when spawning the child */
    input: {} as { parentId: AnyActorRef },
    context: {} as {
      parentId: AnyActorRef;
      file: globalThis.File | null;
      fileUrl: string | null;
    },
    events: {} as
      | { type: "file.upload"; fileList: globalThis.FileList | null }
      | { type: "file.remove" },
  },
  actors: {
    uploadFile: fromPromise(
      ({ input }: { input: { fileList: globalThis.FileList | null } }) =>
        Effect.runPromise(
          Effect.gen(function* () {
            const file = input.fileList?.item(0);
            if (file === null) {
              return yield* Effect.dieMessage("No file selected");
            }

            // 👉 Implement the upload logic here

            return {
              fileUrl: "https://example.com/file.jpg",
              file,
            };
          })
        )
    ),
  },
}).createMachine({
  id: "machines/upload-file",
  context: ({ input }) => ({
    parentId: input.parentId,
    file: null,
    fileUrl: null,
  }),
  initial: "Idle",
  states: {
    Idle: {
      on: {
        "file.upload": {
          target: "Uploading",
        },
      },
    },
    Uploading: {
      invoke: {
        src: "uploadFile",
        input: ({ event }) => {
          assertEvent(event, "file.upload");
          return { fileList: event.fileList };
        },
        onDone: {
          target: "Uploaded",
          actions: [
            assign(({ event }) => ({
              file: event.output.file,
              fileUrl: event.output.fileUrl,
              submitError: null,
            })),

            /** Notify the parent by sending the `fileUrl` */
            sendTo(
              ({ context }) => context.parentId,
              ({ event }): UploadFileEvent => ({
                type: "file.upload",
                fileUrl: event.output.fileUrl,
              })
            ),
          ],
        },
      },
    },
    Uploaded: {
      on: {
        "file.remove": {
          target: "Idle",
          actions: [
            assign({ file: null, fileUrl: null }),

            /** Notify the parent by sending the `file.remove` event */
            sendTo(
              ({ context }) => context.parentId,
              (): UploadFileEvent => ({ type: "file.remove" })
            ),
          ],
        },
      },
    },
  },
});
