import { compose } from '@/lib/http/api-compose';
import { prisma } from '@/lib/prisma';

const toJSON = (data: any) => JSON.parse(JSON.stringify(data));

export const GET = compose(async (req, res) => {
  const { agentId, analyzeId } = req.params;
  const data = await prisma.analysis.findFirst({ where: { id: analyzeId } });
  if (!data) throw new Error('Analysis not found');

  return res.json({ data: toJSON(data) });
});

export const DELETE = compose(async (req, res) => {
  const { agentId, analyzeId } = req.params;
  const data = await prisma.analysis.deleteMany({ where: { id: analyzeId } });
  return res.json({ data: toJSON(data) });
});
