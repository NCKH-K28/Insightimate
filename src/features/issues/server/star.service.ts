import { prisma } from "@/lib/prisma";

export const starService = {
  // ⭐ Star một issue
  async addStar(userId: string, issueId: string) {
    // Kiểm tra issue tồn tại
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new Error("Issue not found");

    // Tạo star (nếu đã tồn tại thì Prisma sẽ lỗi do unique constraint)
    try {
      return await prisma.star.create({
        data: { userId, issueId },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Already starred - bỏ qua hoặc throw error tuỳ ý
        throw new Error("Already starred");
      }
      throw e;
    }
  },

  // ❌ Unstar một issue
  async removeStar(userId: string, issueId: string) {
    return await prisma.star.deleteMany({
      where: { userId, issueId },
    });
  },

  // ✅ Kiểm tra user đã star issue chưa
  async isStarred(userId: string, issueId: string): Promise<boolean> {
    const star = await prisma.star.findUnique({
      where: { userId_issueId: { userId, issueId } },
    });
    return !!star;
  },

  // 📊 Lấy số lượng star của issue
  async getStarCount(issueId: string): Promise<number> {
    return await prisma.star.count({ where: { issueId } });
  },

  // 👥 Lấy danh sách user đã star issue
  async getStarredByUsers(issueId: string) {
    return await prisma.star.findMany({
      where: { issueId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  },

  // ⭐ Lấy danh sách issue mà user đã star
  async getUserStarredIssues(userId: string) {
    return await prisma.star.findMany({
      where: { userId },
      include: {
        issue: {
          select: { 
            id: true, 
            key: true, 
            summary: true, 
            projectId: true,
            status: {
              select: { name: true }
            },
            priority: {
              select: { name: true }
            },
            assignee: {
              select: { id: true, name: true, avatar: true }
            }
          },
        },
      },
    });
  },
};