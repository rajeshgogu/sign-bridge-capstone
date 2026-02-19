import { db } from "@/lib/db";
import { categories, lessons, userProgress } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LessonCard } from "@/components/learn/lesson-card";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const { userId } = await auth();

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug));

  if (!category) {
    notFound();
  }

  const categoryLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.categoryId, category.id))
    .orderBy(asc(lessons.sortOrder));

  const lessonsWithProgress = await Promise.all(
    categoryLessons.map(async (lesson) => {
      let status = "not_started";
      let completionPercentage = 0;

      if (userId) {
        const [progress] = await db
          .select()
          .from(userProgress)
          .where(
            and(
              eq(userProgress.userId, userId),
              eq(userProgress.lessonId, lesson.id)
            )
          );
        if (progress) {
          status = progress.status;
          completionPercentage = progress.completionPercentage ?? 0;
        }
      }

      return { ...lesson, status, completionPercentage };
    })
  );

  return (
    <div>
      <PageHeader
        title={category.name}
        description={category.description ?? "Lessons in this category"}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessonsWithProgress.map((lesson) => (
          <LessonCard
            key={lesson.id}
            id={lesson.id}
            title={lesson.title}
            slug={lesson.slug}
            description={lesson.description}
            difficulty={lesson.difficulty}
            estimatedMinutes={lesson.estimatedMinutes}
            categorySlug={categorySlug}
            status={lesson.status}
            completionPercentage={lesson.completionPercentage}
          />
        ))}
      </div>
    </div>
  );
}
