import { prisma } from './src/lib/prisma/index.js';

async function checkComments() {
  try {
    // Lấy tất cả comments
    const allComments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('🔍 All comments in database:');
    console.log(allComments.map(c => ({
      id: c.id,
      parentId: c.parentId,
      content: c.content.substring(0, 50) + '...',
      issueId: c.issueId,
      userId: c.userId
    })));

    // Lấy comments gốc (không có parentId)
    const rootComments = allComments.filter(c => !c.parentId);
    console.log('\n📝 Root comments:', rootComments.length);

    // Lấy replies (có parentId)
    const replies = allComments.filter(c => c.parentId);
    console.log('💬 Replies:', replies.length);

    if (rootComments.length > 0) {
      const firstRoot = rootComments[0];
      console.log('\n🔍 Checking replies for first root comment:', firstRoot.id);
      
      const repliesForFirst = await prisma.comment.findMany({
        where: { parentId: firstRoot.id },
        orderBy: { createdAt: 'asc' }
      });
      
      console.log('💬 Replies for this comment:', repliesForFirst.length);
      repliesForFirst.forEach(r => {
        console.log(`  - ${r.content.substring(0, 30)}... (by ${r.userName})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkComments();