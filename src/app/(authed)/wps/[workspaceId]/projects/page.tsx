/* eslint-disable react-hooks/incompatible-library */

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
import { ProjectImport, ProjectItem } from '@/contracts/project';
import { Loader2 } from 'lucide-react';
import {
  fetchProjectFacetsQueryOptions,
  listProjectsQueryOptions,
} from '@/features/projects/api/actions';
import { useProjectsQueryParams } from '@/hooks/use-projects-params';
import { projectColumns } from '@/features/projects/ui/table/project-column';
import { Separator } from '@/components/ui/separator';
import ImportProjectButton from '@/features/projects/ui/buttons/import-project-button';
import { useSetAtom } from 'jotai';
import { upsertProjectDraftAtom } from '@/features/projects/state/project-draft-atom';
import { createId } from '@paralleldrive/cuid2';
import AICreateProjectButton from '@/features/projects/ui/buttons/ai-create-project';

const ProjectsListToolbar = (props: { table: ReturnType<typeof useReactTable<ProjectItem>> }) => {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Params are undefined');
  const { query } = useProjectsQueryParams();

  const setUpsert = useSetAtom(upsertProjectDraftAtom);

  const handleUpload = async (file: File) => {
    const text = await file.text();
    const project: ProjectImport = JSON.parse(text);
    console.log('Uploaded project:', project);
    const draftId = createId();
    setUpsert({ id: draftId, data: project });
    router.push(`/wps/${params.workspaceId}/projects/import?d=${draftId}`);
  };

  const { table } = props;
  const workspaceId = params?.workspaceId ?? '';
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
            label: 'Generate Project',
            renderLabel() {
              return <AICreateProjectButton />;
            },
          },
          {
            label: 'Create Project',
            onClick: () => router.push(`/wps/${workspaceId}/projects/create`),
          },
          {
            label: 'Import Project',
            renderLabel() {
              return <ImportProjectButton onImport={(v) => handleUpload(v)} />;
            },
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
    <div id='projects-toolbar' className={cn('w-full', 'space-y-4')}>
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
    <div id='projects-header' className={cn('w-full', 'flex flex-col gap-2')}>
      <h1 className='text-2xl font-semibold'>Projects</h1>
      <span className='text-sm text-muted-foreground'>Manage your workspace projects here.</span>
    </div>
  );
};

export default function ProjectsPage() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('ProjectsPage must be used within a route with workspaceId param');

  if (!params) return null;

  return (
    <section className={cn('w-full h-full', 'relative flex flex-col gap-4')}>
      <ProjectsHeader />
      <Separator orientation='horizontal' />
      <Suspense fallback={<div>Loading...</div>}>
        <ProjectsList params={params} />
      </Suspense>
    </section>
  );
}
