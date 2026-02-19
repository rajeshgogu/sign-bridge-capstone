import { z } from "zod";

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.number(),
      answer: z.string(),
    })
  ),
  timeTakenSeconds: z.number().optional(),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
