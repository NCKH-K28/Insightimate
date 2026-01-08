import { starService } from "@/features/issues/server/star.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const starred = await starService.getUserStarredIssues(userId);

    return NextResponse.json({ data: starred });
  } catch (error: any) {
    console.error("GET /api/v2/star error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
