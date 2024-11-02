import type { paths } from "./schema.d.ts";

import { Request, Schema } from "effect";
import type { ClientError } from "./Client";

export class GetUserByUsername extends Request.TaggedClass("GetUserByUsername")<
  typeof GetUserByUsername.schema.Type,
  ClientError,
  // 👇 Add all the necessary parameters (path/query/body) from the OpenAPI schema
  paths[typeof GetUserByUsername.path]["get"]["parameters"]["path"]
> {
  // 👇 The path is type-safe derived from the OpenAPI schema
  static readonly path = "/2.0/users/{username}" satisfies keyof paths;

  // 👇 Response schema (can be used for validation)
  static readonly schema = Schema.Struct({
    username: Schema.optional(Schema.String),
    uuid: Schema.optional(Schema.String),
  });
}
