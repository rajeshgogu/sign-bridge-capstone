import { db } from "@/lib/db";
import {
  categories,
  lessons,
  userProgress,
  userSignProgress,
  streaks,
  signs,
} from "@/lib/db/schema";
import { eq, and, asc, count } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame } from "lucide-react";

export default async function ProgressPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Please sign in.</p>
      </div>
    );
  }

  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId));

  const [totalSignsResult] = await db.select({ count: count() }).from(signs);
  const [learnedResult] = await db
    .select({ count: count() })
    .from(userSignProgress)
    .where(
      and(
        eq(userSignProgress.userId, userId),
        eq(userSignProgress.learned, true)
      )
    );

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  const categoryProgress = await Promise.all(
    allCategories.map(async (category) => {
      const catLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.categoryId, category.id));

      let completedLessons = 0;
      for (const lesson of catLessons) {
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

      return {
        ...category,
        totalLessons: catLessons.length,
        completedLessons,
        percentage:
          catLessons.length > 0
            ? Math.round((completedLessons / catLessons.length) * 100)
            : 0,
      };
    })
  );

  const totalSigns = totalSignsResult?.count ?? 0;
  const signsLearned = learnedResult?.count ?? 0;
  const overallPercentage =
    totalSigns > 0 ? Math.round((signsLearned / totalSigns) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="Track your learning journey."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {signsLearned} of {totalSigns} signs learned
            </p>
            <Progress value={overallPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Flame className="size-4 text-orange-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {streak?.currentStreak ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Longest: {streak?.longestStreak ?? 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {categoryProgress.filter((c) => c.percentage === 100).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {allCategories.length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryProgress.map((cat) => (
            <div key={cat.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{cat.name}</span>
                <span className="text-muted-foreground">
                  {cat.completedLessons}/{cat.totalLessons} lessons -{" "}
                  {cat.percentage}%
                </span>
              </div>
              <Progress value={cat.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
