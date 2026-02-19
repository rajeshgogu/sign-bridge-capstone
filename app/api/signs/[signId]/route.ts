import { db } from "@/lib/db";
import { signs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ signId: string }> }
) {
  try {
    const { signId } = await params;
    const id = parseInt(signId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid sign ID" },
        { status: 400 }
      );
    }

    const [sign] = await db.select().from(signs).where(eq(signs.id, id));

    if (!sign) {
      return NextResponse.json({ error: "Sign not found" }, { status: 404 });
    }

    return NextResponse.json(sign);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sign" },
      { status: 500 }
    );
  }
}
