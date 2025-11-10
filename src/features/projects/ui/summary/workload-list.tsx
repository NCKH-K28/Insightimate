import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface WorkloadListProps {
  workload: Array<{
    assignee?: { id: string; name: string; avatar?: string };
    openIssues: number;
  }>;
}

export function WorkloadList({ workload }: WorkloadListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Team Workload</CardTitle>
      </CardHeader>
      <CardContent>
        {workload.length === 0 ? (
          <div className='text-center py-4'>
            <Users className='h-8 w-8 text-gray-400 mx-auto mb-2' />
            <p className='text-gray-500 text-sm'>No workload data</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {workload.map((item, index) => (
              <div key={index} className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  {item.assignee ? (
                    <>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={item.assignee.avatar} alt={item.assignee.name} />
                        <AvatarFallback className='text-xs'>
                          {item.assignee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-sm font-medium text-gray-900'>
                        {item.assignee.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className='h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center'>
                        <Users className='h-4 w-4 text-gray-500' />
                      </div>
                      <span className='text-sm font-medium text-gray-900'>Unassigned</span>
                    </>
                  )}
                </div>
                <Badge variant={item.openIssues > 5 ? 'destructive' : 'secondary'}>
                  {item.openIssues}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
