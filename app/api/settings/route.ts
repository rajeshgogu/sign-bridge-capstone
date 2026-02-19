import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    preferredLanguage: user.preferredLanguage,
    accessibilityHighContrast: user.accessibilityHighContrast,
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { preferredLanguage, accessibilityHighContrast } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
  if (accessibilityHighContrast !== undefined)
    updates.accessibilityHighContrast = accessibilityHighContrast;

  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
