import { pgTable, text, integer, timestamp, serial, jsonb } from "drizzle-orm/pg-core";

export const signs = pgTable("signs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  instructions: text("instructions"),
  imageUrl: text("image_url"),
  gifUrl: text("gif_url"),
  videoUrl: text("video_url"),
  category: text("category"),
  hindiText: text("hindi_text"),
  englishText: text("english_text"),
  tags: jsonb("tags").$type<string[]>().default([]),
  handShape: text("hand_shape"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
