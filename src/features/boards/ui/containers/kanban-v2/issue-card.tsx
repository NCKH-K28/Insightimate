import { cn } from '@/lib/utils';
import { ColumnItem } from './ui';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  Play,
  UserIcon,
  Eye,
  Edit,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useParams, useRouter } from 'next/navigation';

type IssueActionsProps = { item: ColumnItem; onDelete?: () => void; onEdit?: () => void };
function IssueActions({ item, onDelete, onEdit }: IssueActionsProps) {
  const handleCopyKey = () => {
    navigator.clipboard.writeText(item.data?.key ?? '');
    toast.success(`${item.data?.key} copied to clipboard`);
  };

  const handleCopyLink = () => {
    toast.success('Issue link copied to clipboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity'
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyKey}>
          <Copy className='h-4 w-4 mr-2' />
          Copy issue key
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <ExternalLink className='h-4 w-4 mr-2' />
          Copy link
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Play className='h-4 w-4 mr-2' />
            Change status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent></DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserIcon className='h-4 w-4 mr-2' />
            Assign to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <UserIcon className='h-4 w-4 mr-2 text-slate-400' />
              Unassigned
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Eye className='h-4 w-4 mr-2' />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className='h-4 w-4 mr-2' />
          Edit issue
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className='text-destructive focus:text-destructive' onClick={onDelete}>
          <Trash2 className='h-4 w-4 mr-2' />
          Remove from sprint
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const StoryPointsBadge = ({ points }: { points?: number }) => {
  if (!points) return null;
  return <Badge className='size-5'>{points}</Badge>;
};

const PriorityIcon = ({ priority }: { priority?: { name: string; iconURL?: string } }) => {
  if (!priority || !priority.iconURL) return null;
  return <Image src={priority.iconURL} alt={priority.name} width={20} height={20} />;
};

const TypeIcon = ({ type }: { type?: { name: string; iconURL?: string } }) => {
  if (!type || !type.iconURL) return null;
  return <Image src={type.iconURL} alt={type.name} width={20} height={20} className='size-4' />;
};

const UserAvatar = ({ user }: { user?: { name: string; avatar?: string } }) => {
  if (!user || !user.avatar) return null;
  return <Image src={user.avatar} alt={user.name} width={20} height={20} className='size-4' />;
};

type IssueCardProps = {
  item: ColumnItem;
  isDragging?: boolean;
  dragProps?: Record<string, unknown>;
  onRemove?: () => void;
  onEdit?: () => void;
};

export const IssueCard = ({ item, isDragging, dragProps, onRemove, onEdit }: IssueCardProps) => {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  if (!params) throw new Error('No workspaceId found');
  if (!router) throw new Error('No router found');
  const issue = item.data;

  const href = `/wps/${params.workspaceId}/projects/${issue.projectId}/issues/${item.id}`;
  return (
    <Card
      className={cn(
        'mb-2 cursor-pointer transition-all duration-200 group',
        'hover:shadow-md hover:border-slate-300',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
        'p-0',
        isDragging && 'shadow-lg ring-2 ring-primary rotate-2 opacity-90',
      )}
      tabIndex={0}
      role='button'
      aria-label={`Issue ${issue.key}: ${issue.summary}`}
    >
      <CardContent className='p-3'>
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex items-center gap-1.5'>
            {dragProps && (
              <Button
                {...dragProps}
                size='icon'
                variant='ghost'
                className={cn('size-4')}
                aria-label='Drag to reorder'
              >
                <GripVertical className='h-4 w-4 text-slate-400' />
              </Button>
            )}
            <TypeIcon type={issue.type} />
            <span
              className='text-xs text-muted-foreground font-medium hover:text-primary hover:underline'
              onClick={() => {
                router.push(href);
              }}
            >
              {issue.key}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <IssueActions item={item} onDelete={onRemove} onEdit={onEdit} />
          </div>
        </div>

        <p className='text-sm font-medium text-foreground leading-snug mb-3 line-clamp-2'>
          {issue.summary}
        </p>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <StoryPointsBadge points={issue.storyPoints ?? undefined} />
            <PriorityIcon priority={issue.priority} />
          </div>
          <UserAvatar user={issue.assignee ?? undefined} />
          <Badge style={{ backgroundColor: issue.status.color }}>
            {issue.status.iconURL ? (
              <Image
                src={issue.status.iconURL}
                alt={issue.status.name}
                width={20}
                height={20}
                className='size-4'
              />
            ) : null}
            {issue.status.name}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
