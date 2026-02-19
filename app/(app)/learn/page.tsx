import { db } from "@/lib/db";
import { categories, userProgress, lessons } from "@/lib/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/page-header";
import { CategoryCard } from "@/components/learn/category-card";

export default async function LearnPage() {
  const { userId } = await auth();

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  const categoriesWithProgress = await Promise.all(
    allCategories.map(async (category) => {
      const categoryLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.categoryId, category.id));

      let completedLessons = 0;

      if (userId && categoryLessons.length > 0) {
        for (const lesson of categoryLessons) {
          const [progress] = await db
            .select()
            .from(userProgress)
            .where(
              and(
                eq(userProgress.userId, userId),
                eq(userProgress.lessonId, lesson.id),
                eq(userProgress.status, "completed")
              )
            );
          if (progress) completedLessons++;
        }
      }

      const totalLessons = categoryLessons.length;
      const completionPercentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      return {
        ...category,
        totalLessons,
        completedLessons,
        completionPercentage,
      };
    })
  );

  return (
    <div>
      <PageHeader
        title="Learn ISL"
        description="Browse categories and start learning Indian Sign Language."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categoriesWithProgress.map((category) => (
          <CategoryCard
            key={category.id}
            id={category.id}
            name={category.name}
            slug={category.slug}
            description={category.description}
            iconName={category.iconName}
            color={category.color}
            totalLessons={category.totalLessons}
            completedLessons={category.completedLessons}
            completionPercentage={category.completionPercentage}
          />
        ))}
      </div>
    </div>
  );
}
