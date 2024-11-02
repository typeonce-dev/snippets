import { Clock, Data, Effect, Number } from "effect";

export interface HLC {
  readonly timestamp: number;
  readonly counter: number;
  readonly node: string;
}

class MaxDriftExceed extends Data.TaggedError("MaxDriftExceed")<{
  current: HLC;
  now: number;
}> {}

class DuplicateNode extends Data.TaggedError("DuplicateNode")<{
  node: string;
}> {}

class CounterOverflow extends Data.TaggedError("CounterOverflow")<{
  current: HLC;
}> {
  static readonly max = 65535;

  override message = `Ensure no more than 4 chars when converted to a hex string (${CounterOverflow.max}), current counter: ${this.current.counter}`;
}

export class Drift extends Effect.Service<Drift>()("Drift", {
  succeed: { maxDriftMillis: 60000 },
}) {}

export const applyClock = (current: HLC) =>
  Effect.gen(function* () {
    const clock = yield* Clock.Clock;
    const drift = yield* Drift;

    if (current.counter > CounterOverflow.max) {
      return yield* new CounterOverflow({ current });
    }

    const now = yield* clock.currentTimeMillis;
    if (Math.abs(current.timestamp - now) > drift.maxDriftMillis) {
      return yield* new MaxDriftExceed({ current, now });
    }

    return current;
  });

export const send = (previous: HLC) =>
  Effect.gen(function* () {
    const clock = yield* Clock.Clock;

    const now = yield* clock.currentTimeMillis;

    // * ensure that timestamp never goes backward
    // * increment the counter if timestamp does not advance
    const timestampNew = Number.max(previous.timestamp, now);
    return yield* applyClock({
      node: previous.node,
      timestamp: timestampNew,
      counter: previous.timestamp === timestampNew ? previous.counter + 1 : 0,
    });
  });

export const receive = (previous: HLC, unsafeRemote: HLC) =>
  Effect.gen(function* () {
    const clock = yield* Clock.Clock;

    if (unsafeRemote.node === previous.node) {
      return yield* new DuplicateNode({ node: unsafeRemote.node });
    }

    const remote = yield* applyClock(unsafeRemote);
    const now = yield* clock.currentTimeMillis;
    const timestampNew = Math.max(previous.timestamp, remote.timestamp, now);
    return yield* applyClock({
      node: previous.node,
      timestamp: timestampNew,
      counter:
        previous.timestamp === timestampNew && remote.timestamp === timestampNew
          ? Math.max(previous.counter, remote.counter) + 1
          : previous.timestamp === timestampNew
          ? previous.counter + 1
          : remote.timestamp === timestampNew
          ? remote.counter + 1
          : // clocks are monotonic, reset counter
            0,
    });
  });
