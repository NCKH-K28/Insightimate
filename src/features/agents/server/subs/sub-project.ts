import { prisma } from '@/lib/prisma';
import { get } from 'lodash';
import { projectToSource } from '../services/source.service';

const subProject = () => {
  return prisma.listen('Project', async (msg) => {
    const projectId = get(msg.record, 'id');
    if (!projectId) {
      console.warn('[sub-project] Không tìm thấy project ID trong payload');
      return;
    }
    if (msg.op === 'DELETE') {
      await prisma.agentSource.deleteMany({
        where: { sourceType: 'PROJECT', sourceId: projectId },
      });
    } else if (msg.op === 'UPDATE') {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        console.warn(`[sub-project] Không tìm thấy project với ID ${projectId} để cập nhật source`);
        return;
      }

      const sourceData = projectToSource(project);
      await prisma.agentSource.updateMany({
        where: { sourceType: 'PROJECT', sourceId: projectId },
        data: { source: sourceData },
      });
    }
  });
};

export const sub = () => {
  return Promise.all([subProject()]);
};
