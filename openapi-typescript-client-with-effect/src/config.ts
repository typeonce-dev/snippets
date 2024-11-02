import { Config } from "effect";
import { OpenApiClient } from "./Client";

// 👇 Layer definition for the OpenAPI client
export const OpenApiLive = OpenApiClient.layer(
  Config.all({
    baseUrl: Config.string("OPENAPI_BASE_URL"),
  })
);
