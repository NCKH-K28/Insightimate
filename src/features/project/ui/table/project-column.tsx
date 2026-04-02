'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { Code2, LucideIcon, User } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { DataTableHeader } from '@/components/table';
import { ProjectItem, ProjectType } from '@/contracts/project';

import { ProjectActions } from './project-actions';
import get from 'lodash/get';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { deleteProjectMutationOptions } from '@/features/project/api/actions';
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
  SOFTWARE: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors',
  // MARKETING: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors',
  // RESEARCH: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors',
  // DESIGN: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 transition-colors',
  // OTHER: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors',
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
  if (!pathname) throw new Error('Pathname is undefined');

  const { project } = props;
  const perm = project.permissions;

  const settingsPath = useMemo(() => {
    const marker = '/projects';
    const idx = pathname.indexOf(marker);

    const base = idx === -1 ? pathname : pathname.substring(0, idx);
    return `${base}/projs/${project.id}`;
  }, [project.id, pathname]);

  const deleteProject = useMutation(deleteProjectMutationOptions({ projId: project.id }));

  const navToEdit = () => router.push(`${settingsPath}#general`, { scroll: true });
  const navToInvite = () => router.push(`${settingsPath}#members`, { scroll: true });

  const handleOnDelete = async () => {
    if (deleteProject.isPending) return;
    await toast.promise(deleteProject.mutateAsync(), {
      loading: 'Deleting project...',
      success: 'Project deleted successfully',
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
        update: hasPerm('update', perm),
        delete: hasPerm('delete', perm),
        invite: hasPerm('invite', perm),
      }}
    />
  );
};

const ProjectNameCell = ({ project }: { project: ProjectItem }) => {
  const params = useParams<{ orgSlug: string }>();
  if (!params) throw new Error('Params is undefined');
  const { orgSlug } = params;

  return (
    <div className='flex flex-row gap-1'>
      <div className='flex items-center gap-2'>
        <span className='text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-0.5 rounded border border-gray-200'>
          {project.key}
        </span>
      </div>
      <Link
        href={`/o/${orgSlug}/projs/${project.id}`}
        className='font-semibold text-foreground hover:text-blue-600 transition-colors duration-200 line-clamp-1'
      >
        {project.name}
      </Link>
    </div>
  );
};

const columnHelper = createColumnHelper<ProjectItem>();

export const projectColumns = [
  columnHelper.display({
    id: 'select',
    size: 40,
    header: ({ table }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='transition-all duration-200'
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='transition-all duration-200'
        />
      </div>
    ),
  }),

  // Avatar/Icon column with improved visuals
  columnHelper.display({
    id: 'avatar',
    size: 48,
    header: () => null,
    cell: ({ row }) => {
      const avatar = row.original.avatar;
      const type = row.original.type;
      const Icon = projectTypeIcons[type] || Code2;

      if (!avatar) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200'>
                  <Icon className='w-5 h-5 text-blue-600' />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{projectTypes[type]} Project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <div className='relative group'>
          <Image
            src={avatar}
            alt={`${row.original.name} avatar`}
            width={40}
            height={40}
            className='rounded-lg shadow-sm group-hover:shadow-md transition-all duration-200 border border-gray-200'
          />
        </div>
      );
    },
  }),

  // Combined Name & Key column for better space usage
  columnHelper.accessor('name', {
    id: 'project',
    size: 250,
    header: ({ column }) => <DataTableHeader title='Project' column={column} />,
    cell: ({ row }) => <ProjectNameCell project={row.original} />,
  }),

  // Improved Type badge
  columnHelper.accessor('type', {
    size: 120,
    header: ({ column }) => <DataTableHeader title='Type' column={column} />,
    cell: ({ row }) => {
      const type = row.original.type;
      const Icon = projectTypeIcons[type];
      if (!Icon) return <span className='text-xs text-muted-foreground'>Unknown</span>;
      return (
        <Badge variant='outline' className={`${projectTypeColors[type]} font-medium`}>
          <Icon className='h-3. 5 w-3.5 mr-1. 5' />
          {projectTypes[type]}
        </Badge>
      );
    },
  }),

  // Enhanced Lead column with better visuals
  columnHelper.accessor('leadId', {
    size: 180,
    filterFn: (row, id, filterValue) => {
      if (filterValue.length === 0) return true;
      const rowValue = row.getValue(id);
      if (rowValue === null) return filterValue.includes(null);
      return filterValue.includes(rowValue);
    },
    header: ({ column }) => <DataTableHeader title='Project Lead' column={column} />,
    cell: ({ row }) => {
      const leadId = row.original.leadId;
      const lead = row.original.lead;

      if (!leadId) {
        return (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <div className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200'>
              <User className='w-4 h-4 text-gray-400' />
            </div>
            <span className='text-sm'>Unassigned</span>
          </div>
        );
      }

      if (!lead) {
        return <span className='text-sm text-red-500 font-medium'>Unknown User</span>;
      }

      return (
        <Link
          href={`/users/${lead.id}`}
          className='flex items-center gap-2 hover:bg-gray-50 -mx-2 px-2 py-1. 5 rounded-md transition-colors duration-200 group'
        >
          {lead.avatar ? (
            <Image
              src={lead.avatar}
              alt={`${lead.name}'s avatar`}
              width={32}
              height={32}
              className='rounded-full border-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-200'
            />
          ) : (
            <Avatar className='w-8 h-8 border-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-200'>
              <AvatarFallback className='bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold text-sm'>
                {lead.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <span className='text-sm font-medium group-hover:text-blue-600 transition-colors duration-200 truncate'>
            {lead.name}
          </span>
        </Link>
      );
    },
  }),

  // Enhanced date columns with relative time
  columnHelper.accessor('createdAt', {
    size: 140,
    header: ({ column }) => <DataTableHeader title='Created' column={column} />,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='text-sm text-muted-foreground cursor-help'>
                <div className='font-medium'>{format(date, 'MMM d, yyyy')}</div>
                <div className='text-xs text-muted-foreground/70'>{relativeTime}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{format(date, 'PPpp')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  }),

  columnHelper.accessor('updatedAt', {
    size: 140,
    header: ({ column }) => <DataTableHeader title='Updated' column={column} />,
    cell: ({ row }) => {
      const date = new Date(row.original.updatedAt);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='text-sm text-muted-foreground cursor-help'>
                <div className='font-medium'>{format(date, 'MMM d, yyyy')}</div>
                <div className='text-xs text-muted-foreground/70'>{relativeTime}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{format(date, 'PPpp')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  }),

  columnHelper.display({
    id: 'actions',
    size: 60,
    cell: ({ row }) => (
      <div className='flex items-center justify-end'>
        <ProjectActionsCell project={row.original} />
      </div>
    ),
  }),
];
