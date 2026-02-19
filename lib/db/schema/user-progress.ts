import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { users } from "./users";
import { lessons } from "./lessons";

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_started"),
  completedSigns: integer("completed_signs").default(0),
  totalSigns: integer("total_signs").default(0),
  completionPercentage: integer("completion_percentage").default(0),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
