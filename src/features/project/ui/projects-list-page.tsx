'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { ProjectItem } from '@/contracts/project';
import { fetchProjectsQueryOptions } from '@/features/project/api/actions';
import { ProjectsTable } from '@/features/project/ui/table/projects-table';
import { ProjectCardGrid } from '@/features/project/ui/cards/project-card-grid';
import {
  ProjectListViewToggle,
  type ProjectListView,
} from '@/features/project/ui/project-list-view-toggle';
import { CreateProjectDialog } from '@/features/project/ui/create-project-dialog';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'project-list-view';

interface ProjectsListPageProps {
  initialData: ProjectItem[];
  orgId: string;
  orgSlug: string;
  context: { userId: string };
}

export function ProjectsListPage({ initialData, orgId, orgSlug, context }: ProjectsListPageProps) {
  const [view, setView] = useState<ProjectListView>('grid');
  const [createOpen, setCreateOpen] = useState(false);

  // Restore preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'table' || stored === 'grid') {
      setView(stored);
    }
  }, []);

  const handleViewChange = (newView: ProjectListView) => {
    setView(newView);
    localStorage.setItem(STORAGE_KEY, newView);
  };

  const { data: projectsResult } = useQuery({
    ...fetchProjectsQueryOptions({ filter: { orgId } }),
    initialData: {
      data: initialData,
      meta: { page: 0, pageSize: initialData.length, total: initialData.length },
    },
  });

  const projects = projectsResult?.data ?? initialData;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Manage your organization&apos;s projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectListViewToggle view={view} onViewChange={handleViewChange} />
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <PlusIcon className="mr-1.5 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <ProjectCardGrid projects={projects} orgSlug={orgSlug} />
      ) : (
        <ProjectsTable initialData={projects} orgId={orgId} context={context} />
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        values={{ leadId: context.userId, orgId }}
      />
    </div>
  );
}
