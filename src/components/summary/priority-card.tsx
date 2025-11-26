'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const priorityChartConfig = {
  issues: { label: 'Issues' },
};

const PriorityCard: React.FC<{ data: any[]; xDomainMax: number }> = ({ data, xDomainMax }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues by Priority</CardTitle>
        <CardDescription>Distribution by priority (Last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={priorityChartConfig}>
          <BarChart accessibilityLayer data={data} layout='vertical' margin={{ left: 0 }}>
            <YAxis
              dataKey='priority'
              type='category'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(v) => String(v)}
            />
            <XAxis dataKey='issues' type='number' hide domain={[0, xDomainMax]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey='issues' layout='vertical' radius={5} fill='#3b82f6' minPointSize={4}>
              <LabelList dataKey='issues' position='right' />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col items-start gap-2 text-sm'>
        <div className='flex gap-2 leading-none font-medium'>
          Trending up by 3.1% this month <TrendingUp className='h-4 w-4' />
        </div>
        <div className='text-muted-foreground leading-none'>
          Showing total issues grouped by priority
        </div>
      </CardFooter>
    </Card>
  );
};

export default PriorityCard;
