import { useMachine } from "@xstate/react";

import * as FormMachine from "./form-machine";
import UploadFileInput from "./upload-file-input";

export default function Form() {
  const [snapshot] = useMachine(FormMachine.machine);
  return (
    <form>
      {/* Pass instance of upload file machine spawned by the parent */}
      <UploadFileInput actor={snapshot.context.uploadImage} />

      {/* Show image when it's uploaded */}
      {snapshot.context.imageUrl && (
        <img src={snapshot.context.imageUrl} alt="Uploaded" />
      )}
    </form>
  );
}
