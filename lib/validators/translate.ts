import { z } from "zod";

export const textToSignSchema = z.object({
  text: z.string().min(1).max(500),
});

export const aiAssistSchema = z.object({
  text: z.string().min(1).max(500),
  type: z.enum(["translate", "explain"]).default("translate"),
});
