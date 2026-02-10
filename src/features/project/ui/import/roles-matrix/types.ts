export type Role = { id: string; name: string; description?: string; permissions: string[] };

export type RolesMatrixProps = {
  basePermissions: string[];
  initialRoles?: Role[];
  onChange?: (roles: Role[]) => void;
  title?: string;
  description?: string;
};
