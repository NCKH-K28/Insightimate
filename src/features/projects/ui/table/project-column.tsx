'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { ProjectList } from '../../../../../.temp/schemas/project';
import Image from 'next/image';
import { format } from 'date-fns';
import { Code2, LucideIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { DataTableHeader } from '@/components/table';
import { ProjectItem, ProjectType } from '@/contracts/projects';

import { ProjectActions } from './project-actions';
import get from 'lodash/get';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { deleteProjectMutationOptions } from '@/features/projects/api/actions';
import { toast } from 'sonner';

const projectTypes: Record<ProjectType, string> = {
  SOFTWARE: 'Software',
  // MARKETING: 'Marketing',
  // RESEARCH: 'Research',
  // DESIGN: 'Design',
  // OTHER: 'Other',
};
const projectTypeIcons: Record<ProjectType, LucideIcon> = {
  SOFTWARE: Code2,
  // MARKETING: Megaphone,
  // RESEARCH: Lightbulb,
  // DESIGN: Palette,
  // OTHER: Package,
};
const projectTypeColors: Record<ProjectType, string> = {
  SOFTWARE: 'bg-blue-50 text-blue-700 border-blue-200',
  // MARKETING: 'bg-green-50 text-green-700 border-green-200',
  // RESEARCH: 'bg-purple-50 text-purple-700 border-purple-200',
  // DESIGN: 'bg-pink-50 text-pink-700 border-pink-200',
  // OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
};

const hasPerm = (
  action: 'update' | 'delete' | 'invite',
  perm: unknown,
  defaultValue = false,
): boolean => {
  return get(perm, action, defaultValue) === true;
};

const ProjectActionsCell = (props: { project: ProjectItem }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { project } = props;
  const perm = project.permissions;

  const settingsPath = useMemo(() => {
    const marker = '/projects';
    const idx = pathname.indexOf(marker);

    const base = idx === -1 ? pathname : pathname.substring(0, idx);
    return `${base}/projects/${project.id}`;
  }, [project.id, pathname]);

  const deleteProject = useMutation(deleteProjectMutationOptions({ projectId: project.id }));

  const navToEdit = () => router.push(`${settingsPath}#general`, { scroll: true });
  const navToInvite = () => router.push(`${settingsPath}#members`, { scroll: true });

  const handleOnDelete = async () => {
    if (deleteProject.isPending) return;
    await toast.promise(deleteProject.mutateAsync(), {
      loading: 'Deleting project...',
      success: 'Project deleted',
      error: (err) => `Error: ${err?.message ?? 'Failed to delete project'}`,
    });
  };

  return (
    <ProjectActions
      projectId={project.id}
      onEdit={navToEdit}
      onInvite={navToInvite}
      onDelete={handleOnDelete}
      permissions={{
        update: hasPerm('update', perm) == true,
        delete: hasPerm('delete', perm) == true,
        invite: hasPerm('invite', perm) == true,
      }}
    />
  );
};

const columnHelper = createColumnHelper<ProjectItem>();
export const projectColumns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
  }),
  columnHelper.accessor('id', {
    header: ({ column }) => <DataTableHeader title='ID' column={column} />,
    cell: ({ row }) => (
      <Link href={`/projects/${row.original.id}`} className='font-medium'>
        {row.original.id}
      </Link>
    ),
  }),
  columnHelper.accessor('key', {
    header: ({ column }) => <DataTableHeader title='Key' column={column} />,
    cell: ({ row }) => (
      <Link
        href={`/wps/${row.original.workspaceId}/projects/${row.original.id}`}
        className='text-muted-foreground'
      >
        {row.original.key}
      </Link>
    ),
  }),
  columnHelper.accessor('name', {
    header: ({ column }) => <DataTableHeader title='Name' column={column} />,
    cell: ({ row }) => <span>{row.original.name}</span>,
  }),
  columnHelper.accessor('type', {
    header: ({ column }) => <DataTableHeader title='Type' column={column} />,
    cell: ({ row }) => {
      const type = row.original.type;
      const Icon = projectTypeIcons[type];
      if (!Icon) return <span className='text-muted-foreground'>Unknown</span>;
      return (
        <Badge variant='outline' className={projectTypeColors[type]}>
          <Icon className='h-4 w-4 mr-1' />
          {projectTypes[type]}
        </Badge>
      );
    },
  }),
  columnHelper.accessor('leadId', {
    filterFn: (row, id, filterValue) => {
      if (filterValue.length === 0) return true;
      const rowValue = row.getValue(id);
      if (rowValue === null) return filterValue.includes(null);
      return filterValue.includes(rowValue);
    },
    header: ({ column }) => <DataTableHeader title='Lead' column={column} />,
    cell: ({ row }) => {
      const leadId = row.original.leadId;
      const lead = row.original.lead;
      if (!leadId) return <span className='text-muted-foreground'>Unassigned</span>;
      if (!lead) return <span className='text-red-500'>Unknown</span>;
      return (
        <Link href={`/users/${lead.id}`} className='flex items-center gap-2'>
          {lead.avatar ? (
            <Image
              src={lead.avatar}
              alt={`${lead.name}'s avatar`}
              width={24}
              height={24}
              className='rounded-full'
            />
          ) : (
            <Avatar className='w-6 h-6'>
              <AvatarFallback>
                <span>{lead.name.charAt(0)}</span>
              </AvatarFallback>
            </Avatar>
          )}
          <span>{lead.name}</span>
        </Link>
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    header: ({ column }) => <DataTableHeader title='Created' column={column} />,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return <div className='text-sm text-muted-foreground'>{format(date, 'MMM d, yyyy')}</div>;
    },
  }),
  columnHelper.accessor('updatedAt', {
    header: ({ column }) => <DataTableHeader title='Updated' column={column} />,
    cell: ({ row }) => {
      const date = new Date(row.original.updatedAt);
      return <div className='text-sm text-muted-foreground'>{format(date, 'MMM d, yyyy')}</div>;
    },
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <ProjectActionsCell project={row.original} />,
  }),
];
