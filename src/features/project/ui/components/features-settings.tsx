'use client';

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Kanban, LayoutList, FileText } from 'lucide-react';

import { getProjectQueryOptions } from '@/features/project/api/actions';
import { projectApi } from '@/features/project/api/http';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FeaturesSettingsProps {
  projectId: string;
}

const FEATURES = [
  {
    key: 'sprintView' as const,
    label: 'Sprint View',
    description: 'Organize work into time-boxed sprints for iterative delivery.',
    icon: LayoutList,
  },
  {
    key: 'boardView' as const,
    label: 'Board View',
    description: 'Visualize workflow with kanban-style boards and columns.',
    icon: Kanban,
  },
  {
    key: 'pageView' as const,
    label: 'Page View',
    description: 'Create and manage project documentation and notes.',
    icon: FileText,
  },
] as const;

export function FeaturesSettings({ projectId }: FeaturesSettingsProps) {
  const queryClient = useQueryClient();
  const { data: project } = useSuspenseQuery(getProjectQueryOptions({ projId: projectId }));

  const updateFeature = useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      projectApi.update({ projId: projectId }, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Feature updated');
    },
    onError: () => {
      toast.error('Failed to update feature');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Features</CardTitle>
        <CardDescription>
          Enable or disable project features. Disabled features will be hidden from the project
          navigation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const isEnabled = (project as any)?.[feature.key] ?? true;

          return (
            <div
              key={feature.key}
              className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor={feature.key} className="text-sm font-medium cursor-pointer">
                    {feature.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <Switch
                id={feature.key}
                checked={isEnabled}
                onCheckedChange={(checked) =>
                  updateFeature.mutate({ [feature.key]: checked })
                }
                disabled={updateFeature.isPending}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
