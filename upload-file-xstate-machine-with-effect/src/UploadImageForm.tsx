import { machine } from "./upload-file-machine";

import { useMachine } from "@xstate/react";

export default function UploadImageForm() {
  const [snapshot, send] = useMachine(machine);
  return (
    <input
      type="file"
      accept="image/*"
      onChange={(event) => send({ type: "upload-file", event })}
    />
  );
}
