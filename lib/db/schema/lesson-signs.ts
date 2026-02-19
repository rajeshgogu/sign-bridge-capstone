import { pgTable, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { lessons } from "./lessons";
import { signs } from "./signs";

export const lessonSigns = pgTable("lesson_signs", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  signId: integer("sign_id")
    .notNull()
    .references(() => signs.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
