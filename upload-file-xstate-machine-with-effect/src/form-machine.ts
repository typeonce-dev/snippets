import { assign, setup, type ActorRefFrom } from "xstate";

import * as UploadFileMachine from "./upload-file-machine";

export const machine = setup({
  types: {
    /** Events shared with the child machine */
    events: {} as UploadFileMachine.UploadFileEvent,

    context: {} as {
      /** Reference to the child machine that handles the file upload */
      uploadImage: ActorRefFrom<typeof UploadFileMachine.machine>;
      imageUrl: string | null;
    },
  },
}).createMachine({
  context: ({ self, spawn }) => ({
    imageUrl: null,

    /** Spawn the child machine and pass a reference to itself */
    uploadImage: spawn(UploadFileMachine.machine, {
      input: { parentId: self },
    }),
  }),
  initial: "Editing",
  states: {
    Editing: {
      /** Events sent by the child machine */
      on: {
        "file.remove": {
          actions: assign({ imageUrl: null }),
        },
        "file.upload": {
          actions: assign(({ event }) => ({ imageUrl: event.fileUrl })),
        },
      },
    },
  },
});
