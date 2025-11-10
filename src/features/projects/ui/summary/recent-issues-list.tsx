import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart3 } from 'lucide-react';

interface RecentIssuesListProps {
  issues: Array<{
    key: string;
    summary: string;
    status: { name: string; color: string };
    assignee?: { name: string; avatar?: string };
    createdAt: string;
    type: string;
  }>;
}

export function RecentIssuesList({ issues }: RecentIssuesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Recent Issues</CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className='text-center py-8'>
            <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-3' />
            <p className='text-gray-500'>No recent issues</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {issues.map((issue) => (
              <div
                key={issue.key}
                className='flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors'
              >
                <div className='flex items-center space-x-4 flex-1 min-w-0'>
                  <Badge variant='outline' className='text-xs font-mono shrink-0'>
                    {issue.key}
                  </Badge>

                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>{issue.summary}</p>
                    <div className='flex items-center space-x-3 mt-1'>
                      <Badge
                        variant='secondary'
                        className='text-xs'
                        style={{
                          backgroundColor: issue.status.color + '20',
                          color: issue.status.color,
                        }}
                      >
                        {issue.status.name}
                      </Badge>
                      <span className='text-xs text-gray-500'>{issue.type}</span>
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-3 shrink-0 ml-4'>
                  {issue.assignee && (
                    <Avatar className='h-6 w-6'>
                      <AvatarImage src={issue.assignee.avatar} alt={issue.assignee.name} />
                      <AvatarFallback className='text-xs'>
                        {issue.assignee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className='text-xs text-gray-500'>
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
