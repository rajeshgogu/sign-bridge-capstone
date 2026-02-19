import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  userProgress,
  userSignProgress,
  userActivity,
  lessonSigns,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { updateProgressSchema } from "@/lib/validators/progress";
import { updateStreak } from "@/lib/helpers/streak";
import {
  calculateCompletionPercentage,
  getLessonStatus,
} from "@/lib/helpers/progress";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const signProgress = await db
      .select()
      .from(userSignProgress)
      .where(eq(userSignProgress.userId, userId));

    return NextResponse.json({ progress, signProgress });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProgressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lessonId, signId, action } = parsed.data;

    if (action === "start_lesson") {
      const [totalSignsResult] = await db
        .select({ count: count() })
        .from(lessonSigns)
        .where(eq(lessonSigns.lessonId, lessonId));

      const totalSigns = totalSignsResult?.count ?? 0;

      const [existing] = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        );

      if (!existing) {
        await db.insert(userProgress).values({
          userId,
          lessonId,
          status: "in_progress",
          completedSigns: 0,
          totalSigns,
          completionPercentage: 0,
        });
      } else {
        await db
          .update(userProgress)
          .set({ lastAccessedAt: new Date(), updatedAt: new Date() })
          .where(eq(userProgress.id, existing.id));
      }

      await db.insert(userActivity).values({
        userId,
        activityType: "lesson_started",
        entityType: "lesson",
        entityId: lessonId,
      });

      await updateStreak(userId);
    }

    if (action === "mark_learned" && signId) {
      const [existing] = await db
        .select()
        .from(userSignProgress)
        .where(
          and(
            eq(userSignProgress.userId, userId),
            eq(userSignProgress.signId, signId)
          )
        );

      if (!existing) {
        await db.insert(userSignProgress).values({
          userId,
          signId,
          learned: true,
          practiceCount: 1,
          lastPracticedAt: new Date(),
        });
      } else {
        await db
          .update(userSignProgress)
          .set({
            learned: true,
            practiceCount: (existing.practiceCount ?? 0) + 1,
            lastPracticedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSignProgress.id, existing.id));
      }

      // Update lesson progress
      const [lessonProgress] = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        );

      if (lessonProgress) {
        const newCompleted = (lessonProgress.completedSigns ?? 0) + 1;
        const total = lessonProgress.totalSigns ?? 0;
        const percentage = calculateCompletionPercentage(newCompleted, total);
        const status = getLessonStatus(newCompleted, total);

        await db
          .update(userProgress)
          .set({
            completedSigns: newCompleted,
            completionPercentage: percentage,
            status,
            completedAt: status === "completed" ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, lessonProgress.id));
      }

      await db.insert(userActivity).values({
        userId,
        activityType: "sign_learned",
        entityType: "sign",
        entityId: signId,
      });

      await updateStreak(userId);
    }

    if (action === "complete_lesson") {
      await db
        .update(userProgress)
        .set({
          status: "completed",
          completionPercentage: 100,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        );

      await db.insert(userActivity).values({
        userId,
        activityType: "lesson_completed",
        entityType: "lesson",
        entityId: lessonId,
      });

      await updateStreak(userId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
