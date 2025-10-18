'use client';

import React, { Suspense, useMemo } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';

import { DataTable, DataTableToolbar, DataTablePagination } from '@/components/table';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ProjectItem } from '@/contracts/projects';
import { Loader2 } from 'lucide-react';
import {
  fetchProjectFacetsQueryOptions,
  listProjectsQueryOptions,
} from '@/features/projects/api/actions';
import { useProjectsQueryParams } from '@/hooks/use-projects-params';
import { projectColumns } from '@/features/projects/ui/table/project-column';
import { Separator } from '@/components/ui/separator';
import { DottedSeparator } from '@/components/dotted-separator';

const ProjectsListToolbar = (props: { table: ReturnType<typeof useReactTable<ProjectItem>> }) => {
  const params = useParams<{ workspaceId: string }>();
  const { query } = useProjectsQueryParams();

  const { table } = props;
  const { workspaceId } = params;
  const router = useRouter();

  const { data: facets } = useSuspenseQuery(fetchProjectFacetsQueryOptions(query));

  const types = useMemo(() => {
    const _types: { value: string | null; label: string }[] = [...facets.types];
    _types.push({ value: null, label: 'No type' });
    return _types;
  }, [facets]);

  const leads = useMemo(() => {
    const _leads: { value: string | null; label: string }[] = facets.leads.map((lead) => ({
      value: lead.value,
      label: lead.label.name,
    }));
    _leads.push({ value: null, label: 'Unassigned' });
    return _leads;
  }, [facets]);

  return (
    <DataTableToolbar
      table={table}
      config={{
        searchPlaceholder: 'Search projects...',
        searchColumn: 'name',
        filters: [
          { type: 'faceted', columnKey: 'type', title: 'Type', options: types },
          { type: 'faceted', columnKey: 'leadId', title: 'Lead', options: leads },
        ],
        actions: [
          {
            label: 'Create Project',
            onClick: () => router.push(`/wps/${workspaceId}/projects/create`),
          },
        ],
      }}
    />
  );
};

type ProjectsListProps = { params: { workspaceId: string } };
const ProjectsList = ({ params }: ProjectsListProps) => {
  const { data: projects, isLoading } = useQuery(listProjectsQueryOptions({ filter: params }));

  const table = useReactTable<ProjectItem>({
    data: projects || [],
    columns: projectColumns,
    state: { columnVisibility: { id: false, createdAt: false, updatedAt: false } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div id='projects-toolbar' className={cn('w-full', 'p-4 sm:p-6 lg:p-8', 'space-y-4')}>
      <Suspense
        fallback={
          <div className='w-full h-12 flex items-center justify-center text-sm text-gray-500' />
        }
      >
        <ProjectsListToolbar table={table} />
      </Suspense>

      {isLoading ? <Loader2 className='mx-auto my-16 h-8 w-8 animate-spin text-gray-500' /> : null}
      {isLoading ? null : (
        <>
          <DataTable table={table} />
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
};

const ProjectsHeader = () => {
  return (
    <div
      id='projects-header'
      className={cn('w-full', 'px-4 sm:px-6 lg:px-8', 'py-4', 'flex flex-col space-y-2')}
    >
      <div className={cn('text-2xl font-bold')}>Projects</div>
      <DottedSeparator/> 
    </div>
  );
};

export default function ProjectsPage() {
  const params = useParams<{ workspaceId: string }>();

  return (
    <section className={cn('w-full h-full', 'relative')}>
      <ProjectsHeader />
      <Suspense fallback={<div>Loading...</div>}>
        <ProjectsList params={params} />
      </Suspense>
    </section>
  );
}
