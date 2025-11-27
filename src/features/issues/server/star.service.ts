import { prisma } from '@/lib/prisma';

export const starService = {
  // ⭐ Star một issue
  async addStar(userId: string, issueId: string) {
    // Kiểm tra issue tồn tại
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new Error('Issue not found');

    // Tạo star (nếu đã tồn tại thì Prisma sẽ lỗi do unique constraint)
    try {
      return await prisma.star.create({
        data: { userId, issueId },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Already starred - bỏ qua hoặc throw error tuỳ ý
        throw new Error('Already starred');
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
    const stars = await prisma.star.findMany({ where: { issueId } });

    const userIds = stars.map((star) => star.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

    // map
    const userMap = new Map(users.map((user) => [user.id, user]));

    const starsWithUsers = stars.map((star) => ({
      ...star,
      user: userMap.get(star.userId),
    }));
    return starsWithUsers;
  },

  // ⭐ Lấy danh sách issue mà user đã star
  async getUserStarredIssues(userId: string) {
    const stars = await prisma.star.findMany({ where: { userId } });

    const issueIds = stars.map((star) => star.issueId);
    const issues = await prisma.issue.findMany({ where: { id: { in: issueIds } } });

    // map
    const issueMap = new Map(issues.map((issue) => [issue.id, issue]));

    const starsWithIssues = stars.map((star) => ({
      ...star,
      issue: issueMap.get(star.issueId),
    }));
    return starsWithIssues;
  },
};
