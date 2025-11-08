import React from 'react';
import { CircleCheckIcon, CircleDashedIcon, CircleDotDashedIcon, CircleDotIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateIssueForm } from '../forms/create-issue-form';
import { mutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi } from '@/features/boards/api/http';
import { toast } from 'sonner';
import z from 'zod';
import { ZBoardIssueCreateInput } from '@/contracts/boards/boards.input';

type FormData = z.infer<typeof ZBoardIssueCreateInput>;

type CreateParams = { projectId: string; boardId: string; sprintId?: string; statusId?: string };

interface KanbanColumnHeaderProps {
    label: string;
    taskCount: number;
    category?: string | null;
    iconURL?: string | null;
    color?: string | null;
    createParams?: CreateParams;
    onCreate?: () => void;
}

const labelIconMap: Record<string, React.ReactNode> = {
    todo: <CircleDashedIcon className="size-[18px] text-red-400" />,
    in_progress: <CircleDotDashedIcon className="size-[18px] text-yellow-400" />,
    done: <CircleCheckIcon className="size-[18px] text-emerald-400" />,
};

const formatLabel = (s: string) =>
    s
        .toString()
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');

export const KanbanColumnHeader = ({ label, taskCount, category, iconURL, color, createParams, onCreate }: KanbanColumnHeaderProps) => {
    const raw = ((category ?? label) || '').toString().toLowerCase();
    const candidates = [
        raw,
        raw.replace(/[_\s-]+/g, '_'),
        raw.replace(/[_\s-]+/g, ''),
    ];

    let icon: React.ReactNode = null;
    for (const c of candidates) {
        if (labelIconMap[c]) {
            icon = labelIconMap[c];
            break;
        }
    }

    if (!icon) {
        if (raw.includes('todo')) icon = labelIconMap['todo'];
        else if (raw.includes('inprogress') || raw.includes('in_progress') || raw.includes('in progress')) icon = labelIconMap['in_progress'];
        else if (raw.includes('done')) icon = labelIconMap['done'];
    }

    if (!icon) {
        if (iconURL) {
            icon = (
                <img
                    src={iconURL}
                    alt={`${label} icon`}
                    className="size-[18px] rounded-sm object-cover"
                    style={{ border: color ? `2px solid ${color}` : undefined }}
                />
            );
        } else {
            icon = <CircleDotIcon className="size-[18px]" style={color ? { color } : undefined} />;
        }
    }
    const [open, setOpen] = React.useState(false);

    const queryClient = useQueryClient();
    const createMutationOptions = mutationOptions({
        mutationFn: (data: FormData) => boardApi.issues.create(createParams!, { ...data, statusId: createParams?.statusId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards', createParams?.boardId, 'issues'] });
            setOpen(false);
        },
    });

    const createIssue = useMutation(createMutationOptions);

    return (
        <div className="px-2 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-x-2">
                {icon}
                <h2 className="text-sm font-medium">{formatLabel(label)}</h2>
                <div className="size-5 flex items-center justify-center rounded-md bg-neutral-200 text-xs text-neutral-700 font-medium">
                    {taskCount}
                </div>
            </div>
            {createParams ? (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-5">
                            <PlusIcon className="size-4 text-neutral-500" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
                        <DialogHeader className='space-y-3'>
                            <DialogTitle className='text-2xl font-bold'>Create New Issue</DialogTitle>
                            <DialogDescription className='text-base'>
                                Fill in the details below to create a new issue for your project.
                            </DialogDescription>
                        </DialogHeader>
                        <CreateIssueForm
                            params={createParams}
                            onCancel={() => setOpen(false)}
                            onSubmit={async (data) => {
                                const fetching = toast.promise(createIssue.mutateAsync(data), {
                                    loading: 'Creating issue...',
                                    success: 'Issue created successfully!',
                                    error: (e) => `Error creating issue: ${e.message || e}`,
                                });
                                await fetching.unwrap();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            ) : (
                <Button variant="ghost" size="icon" className="size-5" disabled>
                    <PlusIcon className="size-4 text-neutral-300" />
                </Button>
            )}
        </div>
    );
};