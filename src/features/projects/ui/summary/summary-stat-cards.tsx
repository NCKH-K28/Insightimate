import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Play,
  TrendingUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

interface ProjectStatCardsProps {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    done: number;
    overdue: number;
    unassigned: number;
  };
  showChart?: boolean;
  variant?: 'default' | 'compact';
}

export function ProjectStatCards({
  stats,
  showChart = false,
  variant = 'default',
}: ProjectStatCardsProps) {
  const statCards = [
    {
      label: 'Total Issues',
      value: stats.total,
      icon: BarChart3,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      accentColor: 'bg-slate-500',
    },
    {
      label: 'Open',
      value: stats.open,
      icon: Circle,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      accentColor: 'bg-blue-500',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Play,
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      accentColor: 'bg-orange-500',
    },
    {
      label: 'Done',
      value: stats.done,
      icon: CheckCircle2,
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      accentColor: 'bg-green-500',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      accentColor: 'bg-red-500',
    },
    {
      label: 'Unassigned',
      value: stats.unassigned,
      icon: Users,
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      accentColor: 'bg-purple-500',
    },
  ];

  // Tính phần trăm đơn giản hơn
  const getPercentage = (value: number): number => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  // Dữ liệu biểu đồ được đơn giản hóa
  const chartData = [
    { name: 'Open', value: stats.open, color: '#3b82f6' },
    { name: 'In Progress', value: stats.inProgress, color: '#f97316' },
    { name: 'Done', value: stats.done, color: '#22c55e' },
    { name: 'Overdue', value: stats.overdue, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Hiển thị compact đơn giản
  if (variant === 'compact') {
    return (
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className='hover:shadow-md transition-shadow'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                    <Icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>{stat.value}</p>
                    <p className='text-sm text-gray-600'>{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Cards thống kê chính */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const percentage = getPercentage(stat.value);
          const isTotal = stat.label === 'Total Issues';

          return (
            <Card key={stat.label} className='hover:shadow-lg transition-all duration-200 group'>
              <CardContent className='p-6'>
                {/* Header với icon và giá trị */}
                <div className='flex items-start justify-between mb-4'>
                  <div className={cn('p-3 rounded-xl', stat.bgColor)}>
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                  {!isTotal && (
                    <div className='text-right'>
                      <span className='text-sm font-medium text-gray-600'>{percentage}%</span>
                    </div>
                  )}
                </div>

                {/* Số liệu chính */}
                <div className='space-y-1'>
                  <p className='text-3xl font-bold text-gray-900'>{stat.value}</p>
                  <p className='text-sm font-medium text-gray-600'>{stat.label}</p>
                </div>

                {/* Thanh tiến trình đơn giản */}
                {!isTotal && (
                  <div className='mt-4'>
                    <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          stat.accentColor,
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Biểu đồ tùy chọn */}
      {showChart && chartData.length > 0 && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Biểu đồ tròn */}
          <Card>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                Issue Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[280px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey='value'
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className='bg-white p-3 rounded-lg shadow-lg border'>
                              <p className='font-medium'>{data.name}</p>
                              <p className='text-sm text-gray-600'>
                                {data.value} issues ({getPercentage(data.value)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Chú thích đơn giản */}
              <div className='grid grid-cols-2 gap-2 mt-4'>
                {chartData.map((item) => (
                  <div key={item.name} className='flex items-center gap-2'>
                    <div className='w-3 h-3 rounded-full' style={{ backgroundColor: item.color }} />
                    <span className='text-sm text-gray-600'>{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Biểu đồ cột */}
          <Card>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-[280px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis
                      dataKey='name'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Bar dataKey='value' radius={[4, 4, 0, 0]} fill='#6366f1' />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload[0]) {
                          return (
                            <div className='bg-white p-3 rounded-lg shadow-lg border'>
                              <p className='font-medium'>{label}</p>
                              <p className='text-sm text-gray-600'>{payload[0].value} issues</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
