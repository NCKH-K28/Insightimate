import * as React from 'react';
import { Role } from './types';

const uid = () =>
  crypto?.randomUUID?.() ??
  `role_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

const normalizePerms = (perms: string[]) => [...new Set(perms)].sort((a, b) => a.localeCompare(b));

export function useRolesMatrix({
  basePermissions,
  initialRoles = [],
  onChange,
}: {
  basePermissions: string[];
  initialRoles?: Role[];
  onChange?: (roles: Role[]) => void;
}) {
  const [roles, setRoles] = React.useState<Role[]>(() =>
    initialRoles.map((r) => ({ ...r, permissions: normalizePerms(r.permissions || []) })),
  );
  const [searchPerm, setSearchPerm] = React.useState('');
  const [dialogState, setDialogState] = React.useState<{
    type: 'add' | 'edit' | null;
    roleId?: string;
  }>({ type: null });
  const [draftName, setDraftName] = React.useState('');
  const [draftDescription, setDraftDescription] = React.useState('');
  const [draftPerms, setDraftPerms] = React.useState<string[]>([]);

  // Use a ref to hold the latest onChange callback to prevent infinite loops
  // when the parent passes a new function reference on every render
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    // Skip first run to avoid calling onChange with initial state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onChangeRef.current?.(roles);
  }, [roles]);

  const sortedBasePerms = React.useMemo(() => normalizePerms(basePermissions), [basePermissions]);
  const filteredPerms = React.useMemo(() => {
    const q = searchPerm.trim().toLowerCase();
    return q ? sortedBasePerms.filter((p) => p.toLowerCase().includes(q)) : sortedBasePerms;
  }, [sortedBasePerms, searchPerm]);

  const activeRole = React.useMemo(
    () => (dialogState.roleId ? roles.find((r) => r.id === dialogState.roleId) : null),
    [roles, dialogState.roleId],
  );

  const updateRoles = (updater: (prev: Role[]) => Role[]) => {
    setRoles((prev) =>
      [...updater(prev)].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    );
  };

  const togglePermission = (roleId: string, perm: string) => {
    updateRoles((prev) =>
      prev.map((r) =>
        r.id !== roleId
          ? r
          : {
              ...r,
              permissions: normalizePerms(
                r.permissions.includes(perm)
                  ? r.permissions.filter((p) => p !== perm)
                  : [...r.permissions, perm],
              ),
            },
      ),
    );
  };

  const setAllPerms = (roleId: string, enabled: boolean) => {
    updateRoles((prev) =>
      prev.map((r) =>
        r.id !== roleId ? r : { ...r, permissions: enabled ? normalizePerms(basePermissions) : [] },
      ),
    );
  };

  const deleteRole = (roleId: string) => updateRoles((prev) => prev.filter((r) => r.id !== roleId));

  const openDialog = (type: 'add' | 'edit', role?: Role) => {
    setDraftName(role?.name ?? '');
    setDraftDescription(role?.description ?? '');
    setDraftPerms(role?.permissions ?? []);
    setDialogState({ type, roleId: role?.id });
  };

  const closeDialog = () => setDialogState({ type: null });

  const submitDialog = () => {
    const name = draftName.trim();
    const description = draftDescription.trim() || undefined;
    if (!name) return;
    if (dialogState.type === 'add') {
      updateRoles((prev) => [
        ...prev,
        { id: uid(), name, description, permissions: normalizePerms(draftPerms) },
      ]);
    } else if (activeRole) {
      updateRoles((prev) =>
        prev.map((r) =>
          r.id === activeRole.id
            ? { ...r, name, description, permissions: normalizePerms(draftPerms) }
            : r,
        ),
      );
    }
    closeDialog();
  };

  return {
    roles,
    filteredPerms,
    searchPerm,
    setSearchPerm,
    dialogState,
    draftName,
    setDraftName,
    draftDescription,
    setDraftDescription,
    draftPerms,
    setDraftPerms,
    activeRole,
    openDialog,
    closeDialog,
    submitDialog,
    togglePermission,
    setAllPerms,
    deleteRole,
    normalizePerms,
  };
}
