'use client';

import Link from 'next/link';
import { Star, Settings, Archive, ArchiveRestore, Trash2, Lock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ProjectItem } from '@/contracts/project';
import { projectApi } from '@/features/project/api/http';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectCardProps {
  project: ProjectItem;
  orgSlug: string;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, orgSlug }: ProjectCardProps) {
  const queryClient = useQueryClient();

  const toggleFavorite = useMutation({
    mutationFn: () =>
      project.permissions?.['is_favorite']
        ? projectApi.delete(`v3/projs/${project.id}/favorites` as any)
        : (projectApi as any).create?.(`v3/projs/${project.id}/favorites`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      project.archived
        ? fetch(`/api/v3/projs/${project.id}/unarchive`, { method: 'POST' })
        : fetch(`/api/v3/projs/${project.id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(project.archived ? 'Project restored' : 'Project archived');
    },
  });

  const projectHref = `/o/${orgSlug}/projs/${project.id}`;
  const settingsHref = `${projectHref}/settings`;

  // Get initials from project name for logo fallback
  const initials = project.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // Parse logo props for emoji display
  const logoEmoji =
    project.logoProps && typeof project.logoProps === 'object' && 'emoji' in project.logoProps
      ? (project.logoProps as any).emoji?.value
      : null;

  return (
    <Link
      href={projectHref}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300',
        'hover:border-border hover:shadow-lg hover:shadow-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        project.archived && 'opacity-70',
      )}
    >
      {/* Cover Image Area */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
        {project.coverImage && (
          <img
            src={project.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top-right actions */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/20 text-white hover:bg-black/40">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
              <DropdownMenuItem asChild>
                <Link href={settingsHref}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => archiveMutation.mutate()}>
                {project.archived ? (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom overlay: Logo + Name */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur-sm text-lg">
            {logoEmoji || initials[0] || '📁'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-white text-sm leading-tight">{project.name}</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-white/80">{project.key}</span>
              {project.network === 'SECRET' && (
                <Lock className="h-2.5 w-2.5 text-white/70" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {project.description?.trim() || `Created ${new Date(project.createdAt).toLocaleDateString()}`}
        </p>

        <div className="mt-3 flex items-center justify-between">
          {/* Member avatars placeholder */}
          <div className="flex -space-x-1.5">
            {project.lead && (
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-card">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {(project.lead.name || project.lead.email || '?')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Lead: {project.lead.name || project.lead.email}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Favorite star */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite.mutate();
            }}
          >
            <Star className={cn('h-3.5 w-3.5', false && 'fill-yellow-400 text-yellow-400')} />
          </Button>
        </div>
      </div>

      {/* Archived badge */}
      {project.archived && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Archived
        </div>
      )}
    </Link>
  );
}
