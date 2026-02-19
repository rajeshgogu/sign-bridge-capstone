import { pgTable, text, integer, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { quizzes } from "./quizzes";
import { signs } from "./signs";

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  signId: integer("sign_id").references(() => signs.id, {
    onDelete: "set null",
  }),
  questionType: text("question_type").notNull(),
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
