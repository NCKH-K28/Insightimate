import { NextResponse } from 'next/server';

export const GET = () => {
  const data = [
    {
      id: 'actor_1',
      actorId: 'user_1',
      actorType: 'USER',
      roleId: 'role_1',
      actor: { id: 'user_1', name: 'John Doe' },
      role: { id: 'role_1', name: 'Admin' },
    },
    {
      id: 'actor_2',
      actorId: 'group_1',
      actorType: 'TEAM',
      roleId: 'role_2',
      actor: { id: 'group_1', name: 'Developers' },
      role: { id: 'role_2', name: 'Editor' },
    },
  ];
  return NextResponse.json(data);
};
