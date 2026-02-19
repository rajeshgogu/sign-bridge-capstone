import { db } from "@/lib/db";
import {
  signs,
  userSignProgress,
  streaks,
  userActivity,
  quizAttempts,
  categories,
  lessons,
  userProgress,
} from "@/lib/db/schema";
import { eq, count, desc, and, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { StreakDisplay } from "@/components/dashboard/streak-display";
import { RecommendationCards } from "@/components/dashboard/recommendation-cards";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  // Fetch stats
  const [totalSignsResult] = await db.select({ count: count() }).from(signs);
  const totalSigns = totalSignsResult?.count ?? 0;

  const [learnedResult] = await db
    .select({ count: count() })
    .from(userSignProgress)
    .where(
      and(
        eq(userSignProgress.userId, userId),
        eq(userSignProgress.learned, true)
      )
    );
  const signsLearned = learnedResult?.count ?? 0;

  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId));

  const [quizCount] = await db
    .select({ count: count() })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));

  const overallProgress =
    totalSigns > 0 ? Math.round((signsLearned / totalSigns) * 100) : 0;

  // Fetch recent activity
  const activities = await db
    .select()
    .from(userActivity)
    .where(eq(userActivity.userId, userId))
    .orderBy(desc(userActivity.createdAt))
    .limit(10);

  // Fetch category progress for chart
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  const chartData = await Promise.all(
    allCategories.map(async (category) => {
      const categoryLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.categoryId, category.id));

      let completedLessons = 0;
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

      return {
        name: category.name,
        completed: completedLessons,
        total: categoryLessons.length,
      };
    })
  );

  // Activity dates for streak calendar
  const activityDates = [
    ...new Set(
      activities.map((a) => a.createdAt.toISOString().split("T")[0])
    ),
  ];

  // Recommendations
  const recommendations: { title: string; description: string; href: string; type: string }[] = [];
  for (const cat of allCategories) {
    const catLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.categoryId, cat.id))
      .orderBy(asc(lessons.sortOrder));

    for (const lesson of catLessons) {
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lesson.id)
          )
        );

      if (!progress || progress.status !== "completed") {
        recommendations.push({
          title: lesson.title,
          description: lesson.description ?? `Continue learning in ${cat.name}`,
          href: `/learn/${cat.slug}/${lesson.slug}`,
          type: cat.name,
        });
        break;
      }
    }
    if (recommendations.length >= 4) break;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your learning overview."
      />

      <StatsCards
        stats={{
          signsLearned,
          totalSigns,
          currentStreak: streak?.currentStreak ?? 0,
          quizzesCompleted: quizCount?.count ?? 0,
          overallProgress,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressChart data={chartData} />
        <StreakDisplay
          currentStreak={streak?.currentStreak ?? 0}
          longestStreak={streak?.longestStreak ?? 0}
          activityDates={activityDates}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity activities={activities} />
        <RecommendationCards recommendations={recommendations} />
      </div>
    </div>
  );
}
