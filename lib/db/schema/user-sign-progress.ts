import { pgTable, text, integer, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";
import { signs } from "./signs";

export const userSignProgress = pgTable("user_sign_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  signId: integer("sign_id")
    .notNull()
    .references(() => signs.id, { onDelete: "cascade" }),
  learned: boolean("learned").default(false),
  practiceCount: integer("practice_count").default(0),
  lastPracticedAt: timestamp("last_practiced_at"),
  bestAccuracy: integer("best_accuracy").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
