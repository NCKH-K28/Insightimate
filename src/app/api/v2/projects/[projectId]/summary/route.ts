import { getProjectSummary } from '@/features/projects/server/cqrs/q-summary';
import { compose } from '@/lib/http/api-compose';
import { NextResponse } from 'next/server';

export const GET = compose(async (req) => {
  const params = req.params;
  const projectId = params.projectId;
  if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });

  const data = await getProjectSummary(projectId);
  const result = { data };
  return NextResponse.json(result);
});
