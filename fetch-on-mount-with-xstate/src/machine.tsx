import { useMachine } from "@xstate/react";
import { assign, fromPromise, setup } from "xstate";

type Input = Readonly<{ id: number }>;
type Post = Readonly<{
  userId: number;
  id: number;
  title: string;
  body: string;
}>;

const machine = setup({
  types: {
    // 👇 Context contains possible `error` and `post`
    context: {} as { error: unknown | null; post: Post | null },
    input: {} as Input,

    // 👇 Initial default event (https://stately.ai/docs/input#initial-event-input)
    events: {} as Readonly<{ type: "xstate.init"; input: Input }>,
  },
  actors: {
    /// 👇 Fetch request inside an actor
    fetch: fromPromise(({ input }: { input: Input }) =>
      fetch(`https://jsonplaceholder.typicode.com/posts/${input.id}`).then(
        async (response) => (await response.json()) as Post
      )
    ),
  },
  actions: {
    onUpdateError: assign((_, { error }: { error: unknown }) => ({ error })),
    onUpdatePost: assign((_, { post }: { post: Post }) => ({ post })),
  },
}).createMachine({
  context: { error: null, post: null },
  initial: "Loading",
  // 👇 Execute the actor at the start ("on mount")
  invoke: {
    src: "fetch",
    // 👇 Input from component
    input: ({ event }) => {
      if (event.type === "xstate.init") {
        return event.input;
      }

      throw new Error("Missing machine input");
    },
    onError: {
      target: ".Error",
      actions: {
        type: "onUpdateError",
        // 👇 When error response set `error` in context
        params: ({ event }) => ({ error: event.error }),
      },
    },
    onDone: {
      target: ".Success",
      actions: {
        type: "onUpdatePost",
        // 👇 When successful response set `user` in context
        params: ({ event }) => ({ post: event.output }),
      },
    },
  },
  states: {
    Loading: {},
    Error: {},
    Success: {},
  },
});

export default function Page() {
  const [snapshot] = useMachine(machine, {
    input: { id: 1 },
  });

  // 👇 Match on states instead of brittle multiple `useState`
  return (
    <div>
      {snapshot.matches("Loading") && <span>Loading...</span>}
      {snapshot.matches("Error") && (
        <pre>{JSON.stringify(snapshot.context.error, null, 2)}</pre>
      )}
      {snapshot.matches("Success") && (
        <pre>{JSON.stringify(snapshot.context.post, null, 2)}</pre>
      )}
    </div>
  );
}
