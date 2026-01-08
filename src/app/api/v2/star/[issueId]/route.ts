import { starService } from "@/features/issues/server/star.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { issueId: string } }) {
  try {
    const userId = req.headers.get("x-user-id");
    const issueId = params.issueId;

    const isStarred = userId ? await starService.isStarred(userId, issueId) : false;
    const starCount = await starService.getStarCount(issueId);

    return NextResponse.json({ isStarred, starCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const issueId = params.issueId;
    await starService.addStar(userId, issueId);
    const starCount = await starService.getStarCount(issueId);

    return NextResponse.json({ success: true, starCount });
  } catch (error: any) {
    console.error("POST /api/v2/star/[issueId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { issueId: string } }) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const issueId = params.issueId;
    await starService.removeStar(userId, issueId);
    const starCount = await starService.getStarCount(issueId);

    return NextResponse.json({ success: true, starCount });
  } catch (error: any) {
    console.error("DELETE /api/v2/star/[issueId] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
