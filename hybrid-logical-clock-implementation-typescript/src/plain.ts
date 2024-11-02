interface HLC {
  timestamp: number;
  counter: number;
  node: string;
}

export const send = (previous: HLC, now: number): HLC => {
  const timestampNew = Math.max(previous.timestamp, now);
  return {
    node: previous.node,
    timestamp: timestampNew,
    counter: previous.timestamp === timestampNew ? previous.counter + 1 : 0,
  };
};

export const receive = (previous: HLC, remote: HLC, now: number): HLC => {
  const timestampNew = Math.max(previous.timestamp, remote.timestamp, now);
  return {
    node: previous.node,
    timestamp: timestampNew,
    counter:
      previous.timestamp === timestampNew && remote.timestamp === timestampNew
        ? Math.max(previous.counter, remote.counter) + 1
        : previous.timestamp === timestampNew
        ? previous.counter + 1
        : remote.timestamp === timestampNew
        ? remote.counter + 1
        : 0,
  };
};

/**
 * Check any event HLC for high clock drift.
 */
export const isValid = (
  clock: HLC,
  now: number,
  maxDrift: number = 60 * 1000
) => Math.abs(clock.timestamp - now) <= maxDrift;
