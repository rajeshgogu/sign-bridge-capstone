import { db } from "@/lib/db";
import { signs } from "@/lib/db/schema";
import { eq, asc, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let query = db.select().from(signs).$dynamic();

    if (category) {
      query = query.where(eq(signs.category, category));
    }

    if (search) {
      query = query.where(
        or(
          ilike(signs.name, `%${search}%`),
          ilike(signs.englishText, `%${search}%`),
          ilike(signs.hindiText, `%${search}%`)
        )
      );
    }

    const results = await query.orderBy(asc(signs.sortOrder));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch signs" },
      { status: 500 }
    );
  }
}
