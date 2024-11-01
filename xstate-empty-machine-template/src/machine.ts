import { setup } from "xstate";

export const machine = setup({
  types: {
    context: {} as {},
    events: {} as Readonly<{ type: "event" }>,
    input: {} as {},
    children: {} as {},
  },
  actions: {},
  actors: {},
}).createMachine({
  id: "",
  context: {},
  initial: "Idle",
  states: {
    Idle: {},
  },
});
