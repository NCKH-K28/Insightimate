'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronRight,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Archive,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  getBoardIssueQueryOptions,
  deleteBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import Image from 'next/image';
import { EditableSummary } from './issue-main-panel';

// ============ Types ============

interface IssueDetailHeaderProps {
  params: {
    orgSlug: string;
    projectId: string;
    boardId: string;
    issueId: string;
  };
  onDelete?: () => void;
}

// ============ Component ============

export default function IssueDetailHeader({ params, onDelete }: IssueDetailHeaderProps) {
  const router = useRouter();
  const { data: issue } = useSuspenseQuery(getBoardIssueQueryOptions(params));
  const { data: project } = useQuery(getProjectQueryOptions({ projId: params.projectId }));

  const deleteMutation = useMutation(deleteBoardIssueMutationOptions(params));

  const handleCopyKey = () => {
    navigator.clipboard.writeText(issue.key);
    toast.success(`${issue.key} copied to clipboard`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Issue link copied to clipboard');
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(issue.id);
      toast.success('Issue deleted');
      onDelete?.();
      router.push(`/o/${params.orgSlug}/projs/${params.projectId}`);
    } catch {
      toast.error('Failed to delete issue');
    }
  };

  const projectName = (project as any)?.name ?? 'Project';

  return (
    <header className='flex items-center justify-between border-b border-border px-4 py-3 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10'>
      <div className='flex items-center gap-3 min-w-0'>
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/o/${params.orgSlug}/projs/${params.projectId}`}>
                {projectName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className='h-3.5 w-3.5' />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className='flex items-center gap-2'>
                {/* Type icon */}
                {issue.type?.iconURL && (
                  <Image
                    src={issue.type.iconURL}
                    alt={issue.type.name}
                    width={16}
                    height={16}
                    className='rounded-sm'
                  />
                )}
                {/* Issue key */}
                <Badge
                  variant='outline'
                  className='font-mono text-xs cursor-pointer hover:bg-accent'
                  onClick={handleCopyKey}
                >
                  {issue.key}
                </Badge>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Inline editable summary */}
        <div className='min-w-0 flex-1'>
          <EditableSummary params={params} />
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-1 shrink-0'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <MoreHorizontal className='h-4 w-4' />
              <span className='sr-only'>More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem onClick={handleCopyKey}>
              <Copy className='h-4 w-4 mr-2' />
              Copy issue key
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <LinkIcon className='h-4 w-4 mr-2' />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenNewTab}>
              <ExternalLink className='h-4 w-4 mr-2' />
              Open in new tab
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className='h-4 w-4 mr-2' />
              Delete issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
