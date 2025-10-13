import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { authenticated } from '@/lib/guards';
import { apiHandler } from '@/lib/http/api-handler';

// GET /api/teams
export const GET = apiHandler(async (request, { params }) => {
  const auth = await authenticated(request, params);

  const items = await prisma.team.findMany({
    where: { OR: [{ members: { some: { userId: auth.user.id } } }] },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: items }, { status: 200 });
});

export const POST = apiHandler(async (request, { params }) => {
  const auth = await authenticated(request, params);
  const body = await request.json();

  const data = await prisma.team.create({
    data: {
      ...body,
      ownerId: auth.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ data }, { status: 201 });
});

// // async (request: NextRequest) => {
// //   try {
// //     const auth = await authenticated(request, {});
// //     const user = auth.user;

// //     const teams = await prisma.team.findMany({
// //       where: {
// //         OR: [{ ownerId: user.id }, { memberships: { some: { userId: user.id } } }],
// //       },
// //       orderBy: { createdAt: 'desc' },
// //     });

// //     return NextResponse.json({ data: teams }, { status: 200 });
// //   } catch (error) {
// //     return httpExceptionFilter(error, request);
// //   }
// // };

// // POST /api/teams
// export const POST = async (request: NextRequest) => {
//   try {
//     const auth = await authenticated(request, {});

//     const body = await request.json();
//     const valid = teamCreateSchema.parse(body);

//     const data = await prisma.team.create({
//       data: {
//         ...valid,
//         ownerId: auth.user.id,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     return NextResponse.json({ data }, { status: 201 });
//   } catch (error) {
//     return httpExceptionFilter(error, request);
//   }
// };
