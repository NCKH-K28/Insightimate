// xử lý khi workspace thêm và xóa

import { openfgaClient } from '@/lib/auth/authz/openfga';
import { buildWorkspaceMemberTuples, buildWorkspaceTuples } from '../authz/tuple-factory';

export const workspaceCreatedHandler = async (ws: { id: string; ownerId: string }) => {
  const tuples = buildWorkspaceTuples({ ...ws, members: [] });
  await openfgaClient.writeTuples(tuples);
};

export const workspaceDeletedHandler = async (ws: { id: string; ownerId: string }) => {
  const tuples = buildWorkspaceTuples({ ...ws, members: [] });
  await openfgaClient.deleteTuples(tuples);
};

export const workspaceMemberCreateHandler = async (wsMem: {
  workspaceId: string;
  userId: string;
  role: 'WS_ADMIN' | 'WS_MEMBER';
}) => {
  const tuples = buildWorkspaceMemberTuples(wsMem);
  await openfgaClient.writeTuples(tuples);
};

export const workspaceMemberDeleteHandler = async (wsMem: {
  workspaceId: string;
  userId: string;
  role: 'WS_ADMIN' | 'WS_MEMBER';
}) => {
  const tuples = buildWorkspaceMemberTuples(wsMem);
  await openfgaClient.deleteTuples(tuples);
};
