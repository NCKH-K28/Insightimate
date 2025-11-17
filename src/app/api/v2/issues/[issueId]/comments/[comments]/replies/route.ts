import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { issueId: string; commentId: string } }
) {
  try {
    const replies = await prisma.comment.findMany({
      where: { parentId: params.commentId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(replies, { status: 200 });
  } catch (err) {
    console.error("❌ Lỗi khi fetch replies:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
