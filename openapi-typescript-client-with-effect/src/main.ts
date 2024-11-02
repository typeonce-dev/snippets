import { Effect, Layer } from "effect";
import { Api } from "./Api";
import { OpenApiLive } from "./config";
import { GetUserByUsername } from "./requests";

// 👇 Layer definition
const ApiLive = Api.Live.pipe(Layer.provide(OpenApiLive));

// 👇 Request definition
const main = Effect.request(
  new GetUserByUsername({
    username: "sandromaglione",
  }),
  Api.getUserByUsername
);

const program = main.pipe(Effect.provide(ApiLive));
Effect.runPromise(program);
