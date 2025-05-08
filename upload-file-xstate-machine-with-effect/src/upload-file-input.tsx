import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";

import * as UploadFileMachine from "./upload-file-machine";

export default function UploadFileInput({
  actor,
}: {
  actor: ActorRefFrom<typeof UploadFileMachine.machine>;
}) {
  const file = useSelector(actor, (snapshot) => snapshot.context.file);

  if (file !== null) {
    return (
      <div>
        <p>File uploaded: {file.name}</p>
        <button onClick={() => actor.send({ type: "file.remove" })}>
          Remove
        </button>
      </div>
    );
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(event) =>
        actor.send({ type: "file.upload", fileList: event.target.files })
      }
    />
  );
}
