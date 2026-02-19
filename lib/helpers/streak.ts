import { db } from "@/lib/db";
import { streaks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateStreak(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const [userStreak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId));

  if (!userStreak) {
    await db.insert(streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
    });
    return { currentStreak: 1, longestStreak: 1 };
  }

  const lastDate = userStreak.lastActivityDate;

  if (lastDate === today) {
    return {
      currentStreak: userStreak.currentStreak ?? 0,
      longestStreak: userStreak.longestStreak ?? 0,
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;

  if (lastDate === yesterdayStr) {
    newStreak = (userStreak.currentStreak ?? 0) + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, userStreak.longestStreak ?? 0);

  await db
    .update(streaks)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
      updatedAt: new Date(),
    })
    .where(eq(streaks.userId, userId));

  return { currentStreak: newStreak, longestStreak: newLongest };
}
