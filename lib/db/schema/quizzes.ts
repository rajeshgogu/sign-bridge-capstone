import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull().default("beginner"),
  questionCount: integer("question_count").default(10),
  timeLimitSeconds: integer("time_limit_seconds"),
  type: text("type").notNull().default("multiple_choice"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
