import { Data, Effect, Layer } from "effect";
import type * as React from "react";

class MissingFileError extends Data.TaggedError("MissingFileError")<{}> {}

const make = (event: React.ChangeEvent<HTMLInputElement>) => ({
  getRequiredFile: Effect.fromNullable(event.target.files?.item(0)).pipe(
    Effect.mapError(() => new MissingFileError())
  ),
});

export class HtmlChangeEvent extends Effect.Tag("HtmlChangeEvent")<
  HtmlChangeEvent,
  Readonly<ReturnType<typeof make>>
>() {
  static readonly fromEvent = (event: React.ChangeEvent<HTMLInputElement>) =>
    Layer.succeed(this, make(event));
}
