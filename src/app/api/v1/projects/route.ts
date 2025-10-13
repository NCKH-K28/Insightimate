import { ZProjectCreateInput } from '@/contracts/projects';
import { authenticated } from '@/lib/guards';
import createProject from '@/lib/services/project/c-project-create';
import { apiHandler } from '@/lib/http/api-handler';
import { NextResponse } from 'next/server';

export const POST = apiHandler(async (request) => {
  const auth = await authenticated(request, {});
  const user = auth.user;

  const body = await request.json();
  const input = ZProjectCreateInput.parse(body);
  const result = await createProject({ userId: user.id, template: 'SCRUM' }, input);

  return NextResponse.json({ data: result }, { status: 201 });
});

// type Context = {};

// export async function GET(request: NextRequest, context: Context) {
//   try {
//     const auth = await authenticated(request, {});
//     const user = auth.user;

//     const reqParams = parseQueryParams(request);
//     const validParams = projectQueryParamsSchema.parse(reqParams);
//     const result = await listProjects({ user }, validParams);

//     return NextResponse.json({ data: result }, { status: 200 });
//   } catch (error) {
//     return httpExceptionFilter(error, request);
//   }
// }

// export async function POST(request: NextRequest, context: Context) {
//   try {
//     const auth = await authenticated(request, {});

//     const body = await request.json();
//     const valid = projectCreateSchema.parse(body);
//     const result = await createProject({ userId: auth.user.id, template: 'SCRUM' }, valid);

//     return NextResponse.json({ data: result }, { status: 201 });
//   } catch (error) {
//     return httpExceptionFilter(error, request);
//   }
// }
