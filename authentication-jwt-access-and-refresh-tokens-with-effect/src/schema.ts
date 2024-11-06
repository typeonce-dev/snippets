import { Schema } from "effect";

const TokenType = Symbol.for("@TokenType");
export const Token = Schema.NonEmptyString.pipe(Schema.brand(TokenType));
