import { middlewareHandler } from '@/lib/http/api-handler';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Link = {
  type: 'project';
  id: string;
  subject: { value: string; label: string };
};

export const GET = middlewareHandler<{ teamId: string }>([], async (_req, { params }) => {
  const { teamId } = params;

  const links: Link[] = [];

  //
  const projects = await prisma.projectActor.findMany({
    where: { actorType: 'TEAM', actorId: teamId },
    include: { project: true },
  });
  for (const p of projects) {
    links.push({
      type: 'project',
      id: p.projectId,
      subject: { value: p.projectId, label: p.project.name },
    });
  }

  const result = { data: links, meta: { total: links.length } };

  return NextResponse.json(result);
});
