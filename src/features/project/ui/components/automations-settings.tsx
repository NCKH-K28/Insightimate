'use client';

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Archive, XCircle } from 'lucide-react';

import { getProjectQueryOptions } from '@/features/project/api/actions';
import { projectApi } from '@/features/project/api/http';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AutomationsSettingsProps {
  projectId: string;
}

const MONTH_OPTIONS = [
  { value: '0', label: 'Disabled' },
  { value: '1', label: '1 month' },
  { value: '2', label: '2 months' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '9', label: '9 months' },
  { value: '12', label: '12 months' },
];

export function AutomationsSettings({ projectId }: AutomationsSettingsProps) {
  const queryClient = useQueryClient();
  const { data: project } = useSuspenseQuery(getProjectQueryOptions({ projId: projectId }));

  const updateAutomation = useMutation({
    mutationFn: (data: Record<string, number>) =>
      projectApi.update({ projId: projectId }, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Automation updated');
    },
    onError: () => {
      toast.error('Failed to update automation');
    },
  });

  const archiveIn = (project as any)?.archiveIn ?? 0;
  const closeIn = (project as any)?.closeIn ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Automations</CardTitle>
        <CardDescription>
          Configure automatic actions for issues in this project. These run on a scheduled basis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-archive */}
        <div className="flex items-start justify-between rounded-lg border border-border/50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Archive className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="archiveIn" className="text-sm font-medium">
                Auto-archive completed issues
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically archive issues that have been in &quot;Done&quot; status for the
                specified duration.
              </p>
            </div>
          </div>
          <Select
            value={String(archiveIn)}
            onValueChange={(val) => updateAutomation.mutate({ archiveIn: Number(val) })}
            disabled={updateAutomation.isPending}
          >
            <SelectTrigger className="w-36" id="archiveIn">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-close */}
        <div className="flex items-start justify-between rounded-lg border border-border/50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="closeIn" className="text-sm font-medium">
                Auto-close inactive issues
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically close issues that have had no activity for the specified duration.
              </p>
            </div>
          </div>
          <Select
            value={String(closeIn)}
            onValueChange={(val) => updateAutomation.mutate({ closeIn: Number(val) })}
            disabled={updateAutomation.isPending}
          >
            <SelectTrigger className="w-36" id="closeIn">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
