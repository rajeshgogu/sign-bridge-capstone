import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { streaks, userActivity } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [streak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, userId));

    const recentActivity = await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt))
      .limit(30);

    return NextResponse.json({
      streak: streak ?? { currentStreak: 0, longestStreak: 0 },
      recentActivity,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch streaks" },
      { status: 500 }
    );
  }
}
