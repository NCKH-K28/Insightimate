'use client';

import { Card, CardContent } from '@/components/ui/card';

export type IssueStatType = {
  name: string;
  stat: string | number;
  change?: string | number;
  changeType?: 'positive' | 'negative';
};
export type IssueStatListProps = { stats: IssueStatType[] };
export const IssueStatList = ({ stats }: IssueStatListProps) => {
  return (
    <dl className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full'>
      {stats.map((item) => (
        <Card key={item.name} className='p-6 py-4 w-full'>
          <CardContent className='p-0'>
            <div className='flex items-center justify-between'>
              <dt className='text-sm font-medium text-muted-foreground'>{item.name}</dt>
            </div>
            <dd className='text-3xl font-semibold text-foreground mt-2'>{item.stat}</dd>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
};
