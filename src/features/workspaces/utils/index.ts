import get from 'lodash/get';
import { WorkspaceActionKey, WorkspaceMemberActionKey } from '@/contracts/workspaces';

export const formatWsRole = (role: string) => {
  const label = role.replace('WS_', '').toLowerCase();
  return { value: role, label: label.charAt(0).toUpperCase() + label.slice(1) };
};

export const hasWorkspacePermission = (action: WorkspaceActionKey, permissions: unknown) => {
  return get(permissions, action, false);
};

export const hasWsMemberPermission = (action: WorkspaceMemberActionKey, permissions: unknown) => {
  return get(permissions, action, false);
};
