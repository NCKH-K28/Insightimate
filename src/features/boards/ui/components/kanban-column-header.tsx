import { CircleCheckIcon, CircleDashedIcon, CircleDotDashedIcon, CircleDotIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateIssueButton } from '../buttons/create-issue-btn';

type CreateParams = { projectId: string; boardId: string; sprintId?: string };

interface KanbanColumnHeaderProps {
    label: string;
    taskCount: number;
    /** If provided, show the full CreateIssueButton wired to project/board/sprint */
    createParams?: CreateParams;
    /** fallback handler when no createParams available */
    onCreate?: () => void;
}

const labelIconMap: Record<string, React.ReactNode> = {
    // backlog: <CircleDashedIcon className="size-[18px] text-pink-400" />,
    todo: <CircleDashedIcon className="size-[18px] text-red-400" />,
    in_progress: <CircleDotDashedIcon className="size-[18px] text-yellow-400" />,
    // in-review: <CircleDotIcon className="size-[18px] text-blue-400" />,
    done: <CircleCheckIcon className="size-[18px] text-emerald-400" />,
};

const formatLabel = (s: string) =>
    s
        .toString()
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');

export const KanbanColumnHeader = ({ label, taskCount, createParams, onCreate }: KanbanColumnHeaderProps) => {
    const key = (label || '').toString().toLowerCase();
    const icon = labelIconMap[key] ?? null;

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
                <CreateIssueButton params={createParams} />
            ) : (
                <Button onClick={onCreate} variant="ghost" size="icon" className="size-5">
                    <PlusIcon className="size-4 text-neutral-500" />
                </Button>
            )}
        </div>
    );
};