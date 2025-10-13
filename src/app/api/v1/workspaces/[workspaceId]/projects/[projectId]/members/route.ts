import { httpExceptionFilter } from '@/lib/http/filters';
import { projectMemberCreateSchema } from '../../../../../../../../../.temp/schemas/project-member';
import { addProjectMember, listProjectMembers } from '@/lib/services/old/project-member';
import { NextResponse, NextRequest } from 'next/server';

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { projectId } = await params;

    const result = await listProjectMembers({ projectId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const input = await projectMemberCreateSchema.parse(body);

    const result = await addProjectMember({ projectId }, input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return httpExceptionFilter(error, request);
  }
}
