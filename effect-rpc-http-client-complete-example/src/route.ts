// @ts-ignore
import type { NextRequest } from "next/server";

import { Effect } from "effect";
import { RpcWebHandler } from "./server";

/**
 * Example of using the rpc handler in a NextJs api route.
 *
 * `handler` takes a standard `Request` and returns `Response`,
 * so it can be used in any API supporting standard requests
 */
export async function POST(request: NextRequest): Promise<Response> {
  const handler = await Effect.runPromise(RpcWebHandler.pipe(Effect.scoped));

  return handler(request);
}
