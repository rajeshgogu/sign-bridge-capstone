import { db } from "@/lib/db";
import {
  lessons,
  categories,
  lessonSigns,
  signs,
  userSignProgress,
} from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LessonContent } from "./lesson-content";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ categorySlug: string; lessonSlug: string }>;
}) {
  const { categorySlug, lessonSlug } = await params;
  const { userId } = await auth();

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug));

  if (!category) notFound();

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.slug, lessonSlug));

  if (!lesson) notFound();

  const lessonSignsData = await db
    .select({ sign: signs })
    .from(lessonSigns)
    .innerJoin(signs, eq(lessonSigns.signId, signs.id))
    .where(eq(lessonSigns.lessonId, lesson.id))
    .orderBy(asc(lessonSigns.sortOrder));

  const signsList = lessonSignsData.map((ls) => ls.sign);

  const learnedSignIds: number[] = [];
  if (userId) {
    for (const sign of signsList) {
      const [progress] = await db
        .select()
        .from(userSignProgress)
        .where(
          and(
            eq(userSignProgress.userId, userId),
            eq(userSignProgress.signId, sign.id),
            eq(userSignProgress.learned, true)
          )
        );
      if (progress) learnedSignIds.push(sign.id);
    }
  }

  return (
    <div>
      <PageHeader
        title={lesson.title}
        description={lesson.description ?? "Learn and practice signs"}
      />

      <LessonContent
        lessonId={lesson.id}
        signs={signsList}
        learnedSignIds={learnedSignIds}
      />
    </div>
  );
}
