// Custom hook cho state management
import { ProjectRole as BaseRole } from '@/contracts/projects';
import { useEffect, useMemo, useState } from 'react';

export type RoleAction = 'create' | 'update' | 'delete' | `delete:${string}#transient`;
export type RoleState = BaseRole & { action?: RoleAction; original?: BaseRole };

export const isDelete = (a?: string) => (a ? a.startsWith('delete') : false);

const isDiff = (r: BaseRole, o: BaseRole) => {
  return (
    r.name !== o.name ||
    r.permissions.sort().join(',') !== o.permissions.sort().join(',') ||
    r.description !== o.description
  );
};

export function useRoleManagement(projectId: string, serverRoles?: BaseRole[]) {
  const [roles, setRoles] = useState<RoleState[]>([]);

  useEffect(() => {
    if (!serverRoles) return;
    const roles: RoleState[] = serverRoles.map((r) => ({ ...r, original: r }));
    setRoles(roles || []);
  }, [serverRoles]);

  const lookup = useMemo(() => {
    return roles.reduce((acc, r) => {
      acc[r.id] = { ...r, permLookup: new Set(r.permissions) };
      return acc;
    }, {} as Record<string, RoleState & { permLookup: Set<string> }>);
  }, [roles]);

  const hasPermission = (roleId: string, perm: string) => {
    const role = lookup[roleId];
    if (!role) return false;
    return role.permLookup.has(perm);
  };

  const addRole = (
    role: Omit<RoleState, 'id' | 'action' | 'original' | 'createdAt' | 'updatedAt'>,
  ) => {
    const id = `role_temp_${Date.now()}`;
    setRoles((prev) => [
      ...prev,
      {
        ...role,
        id,
        action: 'create',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const updateRole = (
    roleId: string,
    updates: Partial<Omit<RoleState, 'id' | 'original' | 'action'>>,
  ) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        if (r.action === 'create') return { ...r, ...updates };
        if (r.action && isDelete(r.action)) return { ...r, ...updates };
        const updated = { ...r, ...updates };
        if (r.original && isDiff(updated, r.original)) return { ...updated, action: 'update' };
        return { ...updated, action: undefined };
      }),
    );
  };

  const deleteRole = (
    roleId: string,
    action: 'delete' | `delete:${string}#transient` = 'delete',
  ) => {
    const role = lookup[roleId];
    if (!role) return;
    if (role.action === 'create') {
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      return;
    }

    if (!action) throw new Error('Action is required to delete a role');
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        return { ...r, action };
      }),
    );
  };

  const restoreRole = (roleId: string) => {
    const role = lookup[roleId];
    if (!role) return;
    if (!isDelete(role.action)) return;

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const restored = { ...r, action: undefined };
        if (r.original && isDiff(restored, r.original)) return { ...restored, action: 'update' };
        return restored;
      }),
    );
  };

  const reset = () => {
    if (!serverRoles) return setRoles([]);
    const roles: RoleState[] = serverRoles.map((r) => ({ ...r, original: r }));
    setRoles(roles || []);
  };

  const translatableRoles = useMemo(() => {
    return roles.filter((r) => !isDelete(r.action));
  }, [roles]);

  return {
    roles,
    hasPermission,
    addRole,
    updateRole,
    deleteRole,
    restoreRole,
    reset,
    translatableRoles,
  };
}
