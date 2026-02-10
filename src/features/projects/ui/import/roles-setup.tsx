'use client';
import { PROJECT_ROLE_PERMISSION_KEYS, ProjectImport, ZProjectImport } from '@/contracts/project';
import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import RolesMatrix from './roles-matrix';

const ZRoles = ZProjectImport.shape.roles;

export default function RolesSetup() {
  const form = useFormContext<ProjectImport>();

  const { fields, replace } = useFieldArray({ control: form.control, name: 'roles' });

  return (
    <RolesMatrix
      basePermissions={Object.values(PROJECT_ROLE_PERMISSION_KEYS)}
      initialRoles={fields}
      onChange={(nextRoles) => {
        const valid = ZRoles.safeParse(nextRoles);
        if (valid.success) replace(valid.data);
      }}
    />
  );
}
