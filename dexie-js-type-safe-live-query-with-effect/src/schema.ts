import { Schema } from "effect";

// 👇 Define schema for all tables inside `dexie`
export class ActivityTable extends Schema.Class<ActivityTable>("ActivityTable")(
  {
    activityId: Schema.Number,
    name: Schema.String,
  }
) {}
