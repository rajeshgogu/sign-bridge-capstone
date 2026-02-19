import { db } from "@/lib/db";
import { lessons, categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("categorySlug");

    if (categorySlug) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug));

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      const categoryLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.categoryId, category.id))
        .orderBy(asc(lessons.sortOrder));

      return NextResponse.json({ category, lessons: categoryLessons });
    }

    const allLessons = await db
      .select()
      .from(lessons)
      .orderBy(asc(lessons.sortOrder));

    return NextResponse.json(allLessons);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
