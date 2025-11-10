import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';

export type IssueDistributionProps = {
  distributions: {
    status: { name: string; count: number; color?: string }[];
    type: { name: string; count: number; color?: string }[];
    priority: { name: string; count: number; color?: string }[];
  };
};

type StatusDistributionChartProps = { data: { name: string; count: number; color?: string }[] };

const chartConfig: ChartConfig = {};

const StatusDistributionChart = ({ data }: StatusDistributionChartProps) => {
  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Pie Chart</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-row items-center justify-center gap-4'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[250px] w-[250px]'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data.map((item) => ({
                  name: item.name,
                  value: item.count,
                  // dùng màu của item nếu có, fallback sang var(--color-chrome)
                  fill: item.color ?? 'var(--color-chrome)',
                }))}
                dataKey='value'
                nameKey='name'
                innerRadius={50}
                outerRadius={80}
                strokeWidth={2}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <CardFooter className='flex-col gap-2 text-sm p-0'>
          {data.map((item) => (
            <div key={item.name} className='flex items-center gap-2'>
              <span
                className='h-3 w-3 rounded-full inline-block'
                style={{ backgroundColor: item.color ?? 'var(--color-chrome)' }}
              ></span>
              <span className='font-medium'>{item.name}</span>
              <span className='ml-auto text-muted-foreground'>{item.count}</span>
            </div>
          ))}
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export const IssueDistribution = ({ distributions }: IssueDistributionProps) => {
  // log
  const [tab, setTab] = React.useState<keyof IssueDistributionProps['distributions']>('status');

  return (
    <Card className='w-full h-60 flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Issue Distribution</CardTitle>
        <Tabs value={tab} onValueChange={(value) => setTab(value as any)}>
          <TabsList className='mt-4'>
            <TabsTrigger value='status'>Status</TabsTrigger>
            <TabsTrigger value='type'>Type</TabsTrigger>
            <TabsTrigger value='priority'>Priority</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <TabsContent value='status'>
          <StatusDistributionChart data={distributions.status} />
        </TabsContent>
        <TabsContent value='type'>
          <StatusDistributionChart data={distributions.type} />
        </TabsContent>
        <TabsContent value='priority'>
          <StatusDistributionChart data={distributions.priority} />
        </TabsContent>
      </CardContent>
    </Card>
  );
};
