import { db } from "@/lib/db";
import { lessons, lessonSigns, signs } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const id = parseInt(lessonId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid lesson ID" },
        { status: 400 }
      );
    }

    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id));

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    const lessonSignsData = await db
      .select({
        sign: signs,
      })
      .from(lessonSigns)
      .innerJoin(signs, eq(lessonSigns.signId, signs.id))
      .where(eq(lessonSigns.lessonId, id))
      .orderBy(asc(lessonSigns.sortOrder));

    return NextResponse.json({
      ...lesson,
      signs: lessonSignsData.map((ls) => ls.sign),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}
