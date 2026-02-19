import { z } from "zod";

export const updateProgressSchema = z.object({
  lessonId: z.number(),
  signId: z.number().optional(),
  action: z.enum(["mark_learned", "start_lesson", "complete_lesson"]),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
