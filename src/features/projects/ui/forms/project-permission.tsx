import { useEffect, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { v4 as uuid } from 'uuid';

import {
  PROJECT_ROLE_PERMISSION_KEYS,
  ProjectCreateInput,
  ProjectRoleCreateInput,
  ProjectRole as ProjectRoleType,
} from '@/contracts/projects';

type ProjectRole = ProjectRoleCreateInput & { id: string };

// ------- Helpers -------
const formatPermLabel = (code: string) => {
  const [domain, action] = code.split(':');
  const domainLabel = domain.charAt(0).toUpperCase() + domain.slice(1).replace('.', ' ');
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1).replace('.', ' ');
  return `${domainLabel} - ${actionLabel}`;
};

const normalizeRole = (r: Partial<ProjectRole>): ProjectRole => ({
  id: r.id ?? uuid(),
  name: r.name ?? '',
  description: r.description ?? '',
  permissions: r.permissions ?? [],
});

const PERMISSION_OPTIONS = PROJECT_ROLE_PERMISSION_KEYS.map((code) => ({
  code,
  label: formatPermLabel(code),
}));

type ProjectPermissionOptions = (typeof PROJECT_ROLE_PERMISSION_KEYS)[number];

const buildPermission = (perms: {
  [key in ProjectPermissionOptions]: boolean;
}): ProjectPermissionOptions[] => {
  return Object.entries(perms)
    .filter(([, value]) => value)
    .map(([key]) => key as ProjectPermissionOptions);
};

// ------- Default matrix -------
const getDefaultRoleMatrix = (): Omit<ProjectRole, 'createdAt' | 'updatedAt'>[] => [
  {
    id: 'product_owner',
    name: 'Product Owner',
    description: 'Responsible for defining project vision and managing the product backlog.',
    permissions: buildPermission({
      'backlog:manage': true,
      'backlog:view': true,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': true,
      'kanban:view': true,
      'kanban:manage': true,
      'kanban.column:manage': true,
      'kanban.issue:manage': true,
    }),
  },
  {
    id: 'scrum_master',
    name: 'Scrum Master',
    description: 'Facilitates the Scrum process and removes impediments for the team.',
    permissions: buildPermission({
      'backlog:manage': true,
      'backlog:view': true,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': true,
      'kanban:view': true,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': false,
    }),
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Works on tasks and contributes to the development of the product.',
    permissions: buildPermission({
      'backlog:manage': false,
      'backlog:view': true,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': false,
      'kanban:view': true,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': true,
    }),
  },
  {
    id: 'stakeholder',
    name: 'Stakeholder',
    description: 'Interested party who needs to stay informed about project progress.',
    permissions: buildPermission({
      'backlog:manage': false,
      'backlog:view': true,
      'backlog.issue:manage': false,
      'backlog.sprint:manage': false,
      'kanban:view': true,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': false,
    }),
  },
];

export const ProjectPermission = (props: {
  form: ReturnType<typeof useForm<ProjectCreateInput>>;
}) => {
  const { form } = props;

  const [roles, setRoles] = useState<ProjectRole[]>(() => {
    const defRoles = form.getValues('roles');
    if (defRoles?.length) return defRoles.map(normalizeRole);
    return getDefaultRoleMatrix();
  });

  // Sync with form
  useEffect(() => {
    form.setValue(
      'roles',
      roles.map((r) => ({
        name: r.name,
        description: r.description,
        permissions: r.permissions,
      })),
      { shouldDirty: true, shouldTouch: true },
    );
  }, [roles, form]);

  const totalPerms = PERMISSION_OPTIONS.length;

  const isAssigned = (roleId: string, permCode: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return false;
    return role.permissions.includes(permCode as ProjectPermissionOptions);
  };

  const assignedCount = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? Object.values(role.permissions).filter(Boolean).length : 0;
  };

  const togglePermission = (roleId: string, permCode: string) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const hasPerm = r.permissions.includes(permCode as ProjectPermissionOptions);
        return {
          ...r,
          permissions: hasPerm
            ? r.permissions.filter((p) => p !== permCode)
            : [...r.permissions, permCode as ProjectPermissionOptions],
        };
      }),
    );
  };

  const removeRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
  };

  const resetDefaults = () => {
    setRoles(getDefaultRoleMatrix());
  };

  return (
    <div className='flex flex-col gap-2'>
      <div>
        <h2 className='text-lg font-medium'>Project Permissions</h2>
        <p className='text-sm text-gray-600'>
          Define roles and permissions for your project members.
        </p>
        <Button
          variant='link'
          className='float-right'
          type='button'
          size='sm'
          onClick={resetDefaults}
        >
          Reset to Default
        </Button>
      </div>

      <div
        className={cn('flex flex-col gap-2', 'max-h-96 overflow-y-auto', 'border rounded-md p-2')}
      >
        {roles.map(({ id, name: role, description }) => (
          <Collapsible key={id} defaultOpen={false} className='border rounded-sm'>
            <CollapsibleTrigger
              className={cn(
                'w-full relative',
                'p-2 bg-gray-100 hover:bg-gray-200 rounded-sm',
                'text-left grid grid-cols-[1fr_auto] gap-2',
              )}
            >
              <div>
                <h3 className='text-base'>
                  {role}
                  <span className='ml-2 text-sm text-gray-500'>
                    ({assignedCount(id)}/{totalPerms})
                  </span>
                </h3>
                {description && <span className='text-sm text-gray-500'>{description}</span>}
              </div>
              <XIcon
                onClick={(e) => {
                  e.stopPropagation();
                  removeRole(id);
                }}
                className='h-4 w-4 text-gray-500 hover:text-red-500 cursor-pointer'
              />
            </CollapsibleTrigger>

            <CollapsibleContent className='p-2'>
              <div className='flex flex-wrap gap-2'>
                {PERMISSION_OPTIONS.map(({ code, label }) => {
                  const assigned = isAssigned(id, code);
                  return (
                    <Badge
                      key={code}
                      className='cursor-pointer justify-self-start'
                      variant={assigned ? 'default' : 'outline'}
                      tabIndex={0}
                      role='switch'
                      aria-checked={assigned}
                      onClick={() => togglePermission(id, code)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          togglePermission(id, code);
                        }
                      }}
                      title={label}
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <AddRoleInput
        onAdd={(roleName) => {
          const id = uuid();
          setRoles((prev) => [
            ...prev,
            {
              id,
              name: roleName,
              description: '',
              permissions: buildPermission({
                'backlog:manage': false,
                'backlog:view': false,
                'backlog.issue:manage': false,
                'backlog.sprint:manage': false,
                'kanban:view': false,
                'kanban:manage': false,
                'kanban.column:manage': false,
                'kanban.issue:manage': false,
              }),
            },
          ]);
        }}
      />
    </div>
  );
};

const AddRoleInput = (props: { onAdd: (roleName: string) => void }) => {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const v = value.trim();
    if (v) {
      props.onAdd(v);
      setValue('');
    }
  };

  return (
    <div className='flex flex-row gap-2 mt-2'>
      <Input
        placeholder='Add new role'
        className='w-full'
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <Button type='button' variant='outline' onClick={handleAdd} disabled={!value.trim()}>
        Add
      </Button>
    </div>
  );
};
