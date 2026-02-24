'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import { Check, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  PROJECT_ROLE_PERMISSION_KEYS,
  ProjectCreateInput,
  ProjectRoleCreateInput,
} from '@/contracts/project';

type ProjectRole = Omit<ProjectRoleCreateInput, 'projectId' | 'createdAt' | 'updatedAt'> & {
  id: string;
};

type PermKey = (typeof PROJECT_ROLE_PERMISSION_KEYS)[number];

// ------- Helpers -------
const normalizeRole = (r: Partial<ProjectRole>): ProjectRole => ({
  id: r.id ?? uuid(),
  name: r.name ?? '',
  description: r.description ?? '',
  permissions: r.permissions ?? [],
});

const buildPermission = (perms: Record<PermKey, boolean>): PermKey[] =>
  Object.entries(perms)
    .filter(([, v]) => v)
    .map(([k]) => k as PermKey);

// Format permission labels for display
const PERM_DISPLAY: Record<string, { group: string; label: string; description: string }> = {
  'kanban:manage': {
    group: 'Kanban',
    label: 'Manage Board',
    description: 'Full control over kanban board settings',
  },
  'kanban.column:manage': {
    group: 'Kanban',
    label: 'Manage Columns',
    description: 'Create, edit, delete, and reorder columns',
  },
  'kanban.issue:manage': {
    group: 'Kanban',
    label: 'Manage Issues',
    description: 'Move and update issues on the board',
  },
  'backlog:manage': {
    group: 'Backlog',
    label: 'Manage Backlog',
    description: 'Full control over backlog settings',
  },
  'backlog.issue:manage': {
    group: 'Backlog',
    label: 'Manage Issues',
    description: 'Create, edit, and delete backlog issues',
  },
  'backlog.sprint:manage': {
    group: 'Backlog',
    label: 'Manage Sprints',
    description: 'Create, start, and complete sprints',
  },
};

// Group permissions by domain
const getPermGroups = () => {
  const groups: {
    group: string;
    perms: { code: PermKey; label: string; description: string }[];
  }[] = [];
  const seen = new Set<string>();

  for (const code of PROJECT_ROLE_PERMISSION_KEYS) {
    const info = PERM_DISPLAY[code] ?? {
      group: 'Other',
      label: code,
      description: code,
    };
    if (!seen.has(info.group)) {
      seen.add(info.group);
      groups.push({ group: info.group, perms: [] });
    }
    const g = groups.find((g) => g.group === info.group)!;
    g.perms.push({ code: code as PermKey, label: info.label, description: info.description });
  }

  return groups;
};

// Role colors for column headers
const ROLE_COLORS = [
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-sky-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-teal-500',
];

// ------- Default matrix -------
const getDefaultRoleMatrix = (): ProjectRole[] => [
  {
    id: 'product_owner',
    name: 'Product Owner',
    description: 'Defining project vision & backlog.',
    permissions: buildPermission({
      'backlog:manage': true,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': true,
      'kanban:manage': true,
      'kanban.column:manage': true,
      'kanban.issue:manage': true,
    }),
  },
  {
    id: 'scrum_master',
    name: 'Scrum Master',
    description: 'Facilitates Scrum process & removes impediments.',
    permissions: buildPermission({
      'backlog:manage': true,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': true,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': false,
    }),
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Works on tasks & product development.',
    permissions: buildPermission({
      'backlog:manage': false,
      'backlog.issue:manage': true,
      'backlog.sprint:manage': false,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': true,
    }),
  },
  {
    id: 'stakeholder',
    name: 'Stakeholder',
    description: 'Interested party who needs to stay informed.',
    permissions: buildPermission({
      'backlog:manage': false,
      'backlog.issue:manage': false,
      'backlog.sprint:manage': false,
      'kanban:manage': false,
      'kanban.column:manage': false,
      'kanban.issue:manage': false,
    }),
  },
];

// ------- Matrix Checkbox -------
function MatrixCheckbox({
  checked,
  onToggle,
  roleColor,
}: {
  checked: boolean;
  onToggle: () => void;
  roleColor: string;
}) {
  return (
    <button
      type='button'
      onClick={onToggle}
      className={cn(
        'h-7 w-7 rounded-md border-2 flex items-center justify-center transition-all',
        'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        checked
          ? `${roleColor} border-transparent text-white shadow-sm`
          : 'border-muted-foreground/20 bg-card hover:border-muted-foreground/40',
      )}
    >
      {checked && <Check className='h-3.5 w-3.5' strokeWidth={3} />}
    </button>
  );
}

// ------- Add Role Input -------
function AddRoleInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const v = value.trim();
    if (v) {
      onAdd(v);
      setValue('');
    }
  };

  return (
    <div className='space-y-1.5'>
      <p className='text-xs font-medium text-muted-foreground'>Add another role</p>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            placeholder='e.g., Designer, Tester, QA Lead...'
            className='pl-8 h-9 text-sm'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-9 px-4 gap-1'
          onClick={handleAdd}
          disabled={!value.trim()}
        >
          <Plus className='h-3.5 w-3.5' />
          Add
        </Button>
      </div>
    </div>
  );
}

// ------- Main Component -------
export const ProjectPermission = (props: {
  form: ReturnType<typeof useForm<ProjectCreateInput>>;
}) => {
  const { form } = props;

  const [roles, setRoles] = useState<ProjectRole[]>(() => {
    const defRoles = form.getValues('roles');
    if (defRoles?.length) return defRoles.map(normalizeRole);
    return getDefaultRoleMatrix();
  });

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

  const permGroups = getPermGroups();
  const totalPerms = PROJECT_ROLE_PERMISSION_KEYS.length;

  const togglePermission = (roleId: string, permCode: string) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const has = r.permissions.includes(permCode as PermKey);
        return {
          ...r,
          permissions: has
            ? r.permissions.filter((p) => p !== permCode)
            : [...r.permissions, permCode as PermKey],
        };
      }),
    );
  };

  const toggleAll = (roleId: string) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const allAssigned = r.permissions.length === totalPerms;
        return {
          ...r,
          permissions: allAssigned ? [] : [...PROJECT_ROLE_PERMISSION_KEYS],
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
    <TooltipProvider delayDuration={200}>
      <div className='space-y-4 py-4'>
        {/* Header */}
        <div className='flex items-center justify-between pb-3 border-b'>
          <div>
            <h3 className='text-lg font-medium'>Permission Matrix</h3>
            <p className='text-sm text-muted-foreground'>
              Configure role-based access for your team
            </p>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 text-xs'
            onClick={resetDefaults}
          >
            <RotateCcw className='h-3 w-3' />
            Reset
          </Button>
        </div>

        {/* Matrix Table */}
        <ScrollArea className='w-full'>
          <div className='min-w-fit'>
            <table className='w-full border-collapse'>
              {/* Column Headers = Roles */}
              <thead>
                <tr>
                  <th className='text-left p-2 w-40 min-w-[160px]'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                      Permission
                    </span>
                  </th>
                  {roles.map((role, ri) => {
                    const color = ROLE_COLORS[ri % ROLE_COLORS.length];
                    const permCount = role.permissions.length;
                    const allChecked = permCount === totalPerms;

                    return (
                      <th key={role.id} className='p-2 min-w-[90px]'>
                        <div className='flex flex-col items-center gap-1.5'>
                          {/* Color dot + name */}
                          <div className='flex items-center gap-1.5'>
                            <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
                            <span className='text-xs font-semibold whitespace-nowrap'>
                              {role.name}
                            </span>
                          </div>

                          {/* Permission count */}
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                              allChecked
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {allChecked ? 'Full' : `${permCount}/${totalPerms}`}
                          </span>

                          {/* Toggle all + Remove */}
                          <div className='flex gap-0.5'>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  onClick={() => toggleAll(role.id)}
                                  className={cn(
                                    'text-[9px] px-1.5 py-0.5 rounded transition-colors',
                                    allChecked
                                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                                  )}
                                >
                                  {allChecked ? 'None' : 'All'}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side='bottom' className='text-xs'>
                                {allChecked ? 'Remove all permissions' : 'Grant all permissions'}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  onClick={() => removeRole(role.id)}
                                  className='text-muted-foreground/50 hover:text-destructive transition-colors p-0.5'
                                >
                                  <Trash2 className='h-3 w-3' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side='bottom' className='text-xs'>
                                Remove role
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {permGroups.map((group) => (
                  <>
                    {/* Group header row */}
                    <tr key={`group-${group.group}`}>
                      <td colSpan={roles.length + 1} className='pt-3 pb-1 px-2'>
                        <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                          {group.group}
                        </span>
                      </td>
                    </tr>

                    {/* Permission rows */}
                    {group.perms.map((perm) => (
                      <tr
                        key={perm.code}
                        className='group/row hover:bg-accent/50 transition-colors'
                      >
                        <td className='p-2'>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className='text-sm cursor-default'>{perm.label}</span>
                            </TooltipTrigger>
                            <TooltipContent side='right' className='text-xs max-w-[200px]'>
                              {perm.description}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {roles.map((role, ri) => {
                          const checked = role.permissions.includes(perm.code);
                          const color = ROLE_COLORS[ri % ROLE_COLORS.length];
                          return (
                            <td key={role.id} className='p-2 text-center'>
                              <div className='flex justify-center'>
                                <MatrixCheckbox
                                  checked={checked}
                                  onToggle={() => togglePermission(role.id, perm.code)}
                                  roleColor={color}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>

        {/* Add Role */}
        <AddRoleInput
          onAdd={(roleName) => {
            setRoles((prev) => [
              ...prev,
              { id: uuid(), name: roleName, description: '', permissions: [] },
            ]);
          }}
        />
      </div>
    </TooltipProvider>
  );
};
