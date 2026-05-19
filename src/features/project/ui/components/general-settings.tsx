'use client';

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { fetchProjectQueryOptions } from '@/features/project/api/actions';
import { projectApi } from '@/features/project/api/http';
import { UpdateProjectForm } from '../forms/update-project-form';
import { CoverImagePicker } from './cover-image-picker';
import { LogoPicker } from './logo-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const GeneralSettings = (props: { projectId: string }) => {
  const queryClient = useQueryClient();
  const { data: project } = useSuspenseQuery(fetchProjectQueryOptions(props));

  const updateField = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      projectApi.update({ projId: props.projectId }, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', props.projectId] });
      toast.success('Project updated');
    },
    onError: () => {
      toast.error('Failed to update');
    },
  });

  return (
    <div className="space-y-6">
      {/* Cover Image & Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branding</CardTitle>
          <CardDescription>
            Customize your project&apos;s visual identity with a cover image and logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cover Image</Label>
            <CoverImagePicker
              value={(project as any)?.coverImage ?? null}
              onChange={(url) => updateField.mutate({ coverImage: url })}
              disabled={updateField.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Project Logo</Label>
            <div className="flex items-center gap-3">
              <LogoPicker
                value={(project as any)?.logoProps ?? null}
                onChange={(logo) => updateField.mutate({ logoProps: logo })}
                disabled={updateField.isPending}
                size="lg"
              />
              <p className="text-xs text-muted-foreground">
                Choose an emoji to represent your project
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visibility</CardTitle>
          <CardDescription>
            Control who can discover and access this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="network" className="text-sm font-medium">
                Network
              </Label>
              <p className="text-xs text-muted-foreground">
                Secret projects are only visible to members. Public projects are visible to all organization members.
              </p>
            </div>
            <Select
              value={(project as any)?.network ?? 'PUBLIC'}
              onValueChange={(val) => updateField.mutate({ network: val })}
              disabled={updateField.isPending}
            >
              <SelectTrigger className="w-32" id="network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="SECRET">Secret</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Existing project info form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
          <CardDescription>
            Update core project information like name and description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateProjectForm
            params={{ projectId: project.id }}
            defaultValues={project}
            onSuccess={() => {
              // Handle success
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
