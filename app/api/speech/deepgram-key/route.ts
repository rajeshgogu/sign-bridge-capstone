import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@deepgram/sdk";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram not configured" },
      { status: 503 }
    );
  }

  try {
    const deepgram = createClient(apiKey);

    const { result } = await deepgram.manage.createProjectKey(
      // Use the first project
      (await deepgram.manage.getProjects()).result?.projects?.[0]?.project_id ?? "",
      {
        comment: "sign-bridge-temp-key",
        scopes: ["usage:write"],
        time_to_live_in_seconds: 30,
      }
    );

    return NextResponse.json({ key: result?.key });
  } catch {
    // Fallback: return the API key directly for simpler setups
    // In production, use the temporary key approach above
    return NextResponse.json({ key: apiKey });
  }
}
