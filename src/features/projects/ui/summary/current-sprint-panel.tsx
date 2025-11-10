import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock } from 'lucide-react';

interface CurrentSprintPanelProps {
  sprint?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    totalIssues: number;
    completedIssues: number;
    storyPoints: { completed: number; total: number };
  };
}

export function CurrentSprintPanel({ sprint }: CurrentSprintPanelProps) {
  if (!sprint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>Current Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <CalendarDays className='h-12 w-12 text-gray-400 mx-auto mb-3' />
            <p className='text-gray-500'>No active sprint</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (sprint.completedIssues / sprint.totalIssues) * 100;
  const storyPointsPercentage = (sprint.storyPoints.completed / sprint.storyPoints.total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Current Sprint</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <h4 className='font-medium text-gray-900'>{sprint.name}</h4>
          <div className='flex items-center space-x-4 text-sm text-gray-500 mt-1'>
            <div className='flex items-center space-x-1'>
              <CalendarDays className='h-4 w-4' />
              <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
            </div>
            <span>-</span>
            <div className='flex items-center space-x-1'>
              <Clock className='h-4 w-4' />
              <span>{new Date(sprint.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <div>
            <div className='flex justify-between text-sm mb-1'>
              <span className='text-gray-600'>Issues Progress</span>
              <span className='font-medium'>
                {sprint.completedIssues}/{sprint.totalIssues}
              </span>
            </div>
            <Progress value={progressPercentage} className='h-2' />
          </div>

          <div>
            <div className='flex justify-between text-sm mb-1'>
              <span className='text-gray-600'>Story Points</span>
              <span className='font-medium'>
                {sprint.storyPoints.completed}/{sprint.storyPoints.total}
              </span>
            </div>
            <Progress value={storyPointsPercentage} className='h-2' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
