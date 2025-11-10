'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface DistributionItem {
  id: string;
  name: string;
  count: number;
  color?: string;
  category?: string;
}

interface IssueDistributionPanelProps {
  distribution: {
    byStatus: Array<DistributionItem>;
    byType: Array<DistributionItem>;
    byPriority: Array<DistributionItem>;
  };
}

// Default colors for charts
const defaultColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Status category colors
const statusCategoryColors = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#f59e0b',
  DONE: '#10b981',
};

export function IssueDistributionPanel({ distribution }: IssueDistributionPanelProps) {
  // Prepare chart data with colors
  const statusChartData = distribution.byStatus.map((item, index) => ({
    ...item,
    fill: item.category
      ? statusCategoryColors[item.category as keyof typeof statusCategoryColors]
      : item.color || defaultColors[index % defaultColors.length],
  }));

  const typeChartData = distribution.byType.map((item, index) => ({
    ...item,
    fill: item.color || defaultColors[index % defaultColors.length],
  }));

  const priorityChartData = distribution.byPriority.map((item, index) => ({
    ...item,
    fill: item.color || defaultColors[index % defaultColors.length],
  }));

  // Chart configs
  const statusChartConfig: ChartConfig = distribution.byStatus.reduce((acc, item, index) => {
    acc[item.id] = {
      label: item.name,
      color: item.category
        ? statusCategoryColors[item.category as keyof typeof statusCategoryColors]
        : item.color || defaultColors[index % defaultColors.length],
    };
    return acc;
  }, {} as ChartConfig);

  const typeChartConfig: ChartConfig = distribution.byType.reduce((acc, item, index) => {
    acc[item.id] = {
      label: item.name,
      color: item.color || defaultColors[index % defaultColors.length],
    };
    return acc;
  }, {} as ChartConfig);

  const priorityChartConfig: ChartConfig = distribution.byPriority.reduce((acc, item, index) => {
    acc[item.id] = {
      label: item.name,
      color: item.color || defaultColors[index % defaultColors.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className='w-full'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg font-semibold'>Issue Distribution</CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <Tabs defaultValue='status' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-6'>
            <TabsTrigger value='status' className='text-sm'>
              By Status
            </TabsTrigger>
            <TabsTrigger value='type' className='text-sm'>
              By Type
            </TabsTrigger>
            <TabsTrigger value='priority' className='text-sm'>
              By Priority
            </TabsTrigger>
          </TabsList>

          {/* Status Distribution */}
          <TabsContent value='status' className='mt-0'>
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
              {/* Pie Chart */}
              <div className='w-full'>
                <div className='h-[280px] w-full'>
                  <ChartContainer config={statusChartConfig} className='h-full w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie
                          data={statusChartData}
                          dataKey='count'
                          nameKey='name'
                          cx='50%'
                          cy='50%'
                          outerRadius='70%'
                          label={({ name, count, percent }) =>
                            count > 0 ? `${name}: ${count} (${(percent * 100).toFixed(0)}%)` : ''
                          }
                          labelLine={false}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              {/* List View */}
              <div className='space-y-4'>
                <h4 className='text-sm font-medium text-muted-foreground'>Status Breakdown</h4>
                <div className='space-y-3 max-h-[240px] overflow-y-auto'>
                  {statusChartData.map((item) => (
                    <div key={item.id} className='flex items-center justify-between py-2'>
                      <div className='flex items-center space-x-3 min-w-0 flex-1'>
                        <div
                          className='w-3 h-3 rounded-full flex-shrink-0'
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className='text-sm font-medium truncate'>{item.name}</span>
                        {item.category && (
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-xs flex-shrink-0',
                              item.category === 'DONE' && 'border-green-500 text-green-700',
                              item.category === 'IN_PROGRESS' &&
                                'border-orange-500 text-orange-700',
                              item.category === 'TODO' && 'border-slate-500 text-slate-700',
                            )}
                          >
                            {item.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant='secondary'
                        className='text-xs font-semibold ml-2 flex-shrink-0'
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Type Distribution */}
          <TabsContent value='type' className='mt-0'>
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
              {/* Bar Chart */}
              <div className='w-full'>
                <div className='h-[280px] w-full'>
                  <ChartContainer config={typeChartConfig} className='h-full w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={typeChartData}
                        margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                      >
                        <XAxis
                          dataKey='name'
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor='end'
                          height={60}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey='count' radius={[4, 4, 0, 0]}>
                          {typeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              {/* List View */}
              <div className='space-y-4'>
                <h4 className='text-sm font-medium text-muted-foreground'>Type Breakdown</h4>
                <div className='space-y-3 max-h-[240px] overflow-y-auto'>
                  {typeChartData
                    .sort((a, b) => b.count - a.count)
                    .map((item) => (
                      <div key={item.id} className='flex items-center justify-between py-2'>
                        <div className='flex items-center space-x-3 min-w-0 flex-1'>
                          <div
                            className='w-3 h-3 rounded-full flex-shrink-0'
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className='text-sm font-medium truncate'>{item.name}</span>
                        </div>
                        <Badge
                          variant='secondary'
                          className='text-xs font-semibold ml-2 flex-shrink-0'
                        >
                          {item.count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Priority Distribution */}
          <TabsContent value='priority' className='mt-0'>
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
              {/* Horizontal Bar Chart */}
              <div className='w-full'>
                <div className='h-[280px] w-full'>
                  <ChartContainer config={priorityChartConfig} className='h-full w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={priorityChartData.sort((a, b) => b.count - a.count)}
                        layout='horizontal'
                        margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                      >
                        <XAxis type='number' tick={{ fontSize: 11 }} />
                        <YAxis
                          dataKey='name'
                          type='category'
                          tick={{ fontSize: 11 }}
                          width={60}
                          interval={0}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey='count' radius={[0, 4, 4, 0]}>
                          {priorityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              {/* List View */}
              <div className='space-y-4'>
                <h4 className='text-sm font-medium text-muted-foreground'>Priority Breakdown</h4>
                <div className='space-y-3 max-h-[240px] overflow-y-auto'>
                  {priorityChartData
                    .sort((a, b) => b.count - a.count)
                    .map((item) => (
                      <div key={item.id} className='flex items-center justify-between py-2'>
                        <div className='flex items-center space-x-3 min-w-0 flex-1'>
                          <div
                            className='w-3 h-3 rounded-full flex-shrink-0'
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className='text-sm font-medium truncate'>{item.name}</span>
                        </div>
                        <Badge
                          variant='secondary'
                          className='text-xs font-semibold ml-2 flex-shrink-0'
                        >
                          {item.count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
