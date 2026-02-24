import * as React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, PieChart, Pie } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Counts = Record<string, number> & { total: number };
type Points = Record<string, number> & { total: number };

export type BreakdownItem = {
  key: string;
  display?: string;
  counts: Counts;
  points?: Points;
};

type MetricMode = 'counts' | 'points';
type ViewMode = 'bar' | 'pie' | 'list';

// ✅ SỬA:  Sử dụng màu HEX hoặc HSL đầy đủ thay vì CSS variables
const CHART_COLORS = {
  default: [
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#14b8a6', // Teal
    '#ec4899', // Pink
    '#0ea5e9', // Sky
    '#f97316', // Orange
    '#a855f7', // Violet
    '#10b981', // Emerald
    '#eab308', // Yellow
  ],
  vibrant: [
    '#4f46e5', // Indigo
    '#7c3aed', // Purple
    '#c026d3', // Fuchsia
    '#e11d48', // Rose
    '#ea580c', // Orange
    '#ca8a04', // Yellow
    '#16a34a', // Green
    '#0891b2', // Cyan
  ],
  pastel: [
    '#93c5fd', // Light Blue
    '#86efac', // Light Green
    '#fcd34d', // Light Amber
    '#c4b5fd', // Light Purple
    '#fca5a5', // Light Red
    '#5eead4', // Light Teal
    '#f9a8d4', // Light Pink
    '#7dd3fc', // Light Sky
  ],
  monochrome: [
    '#3b82f6',
    '#60a5fa',
    '#93c5fd',
    '#2563eb',
    '#1d4ed8',
    '#bfdbfe',
    '#1e40af',
    '#dbeafe',
  ],
  categorical: [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#22c55e', // Green
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#14b8a6', // Teal
    '#ec4899', // Pink
    '#eab308', // Yellow
  ],
};

export type ColorScheme = 'default' | 'vibrant' | 'pastel' | 'monochrome' | 'categorical';

// Semantic colors cho status/priority
const SEMANTIC_COLORS: Record<string, string> = {
  // Status
  done: '#22c55e',
  completed: '#22c55e',
  success: '#22c55e',
  'in-progress': '#3b82f6',
  in_progress: '#3b82f6',
  pending: '#f59e0b',
  waiting: '#f59e0b',
  blocked: '#ef4444',
  failed: '#ef4444',
  error: '#ef4444',
  cancelled: '#6b7280',
  canceled: '#6b7280',
  // Priority
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
  none: '#6b7280',
};

// Helper functions
function getChartColor(index: number, scheme: ColorScheme = 'default'): string {
  const colors = CHART_COLORS[scheme];
  return colors[index % colors.length];
}

function getColorByKey(key: string, scheme: ColorScheme = 'default'): string {
  const colors = CHART_COLORS[scheme];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function BreakdownCard(props: {
  title: string;
  subtitle?: string;
  items?: BreakdownItem[];
  totalCounts?: number;
  totalPoints?: number;
  mode?: MetricMode;
  topN?: number;
  defaultView?: ViewMode;
  showViewToggle?: boolean;
  showModeToggle?: boolean;
  colorScheme?: ColorScheme;
  useSemanticColors?: boolean;
  customColors?: Record<string, string>;
  onSelect?: (key: string) => void;
}) {
  const {
    title,
    subtitle,
    items = [],
    totalCounts,
    totalPoints,
    mode = 'counts',
    topN = 6,
    defaultView = 'bar',
    showViewToggle = true,
    showModeToggle = true,
    colorScheme = 'default',
    useSemanticColors = true,
    customColors = {},
    onSelect,
  } = props;

  const [viewMode, setViewMode] = React.useState<ViewMode>(defaultView);
  const [metricMode, setMetricMode] = React.useState<MetricMode>(mode);

  const hasPoints = items.some((it) => it.points && Number.isFinite(it.points.total));
  const effectiveMode: MetricMode = metricMode === 'points' && hasPoints ? 'points' : 'counts';

  const valueOf = (it: BreakdownItem) => {
    if (effectiveMode === 'points') return it.points?.total ?? 0;
    return it.counts.total ?? 0;
  };

  const overall =
    effectiveMode === 'points'
      ? typeof totalPoints === 'number'
        ? totalPoints
        : items.reduce((s, it) => s + (it.points?.total ?? 0), 0)
      : typeof totalCounts === 'number'
        ? totalCounts
        : items.reduce((s, it) => s + (it.counts.total ?? 0), 0);

  const sorted = [...items].sort((a, b) => valueOf(b) - valueOf(a)).slice(0, topN);

  const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));

  // ✅ Hàm lấy màu với fallback rõ ràng
  const getItemColor = (item: BreakdownItem, index: number): string => {
    const keyLower = item.key.toLowerCase().trim();

    // 1. Custom colors ưu tiên cao nhất
    if (customColors[item.key]) {
      return customColors[item.key];
    }

    // 2. Semantic colors
    if (useSemanticColors && SEMANTIC_COLORS[keyLower]) {
      return SEMANTIC_COLORS[keyLower];
    }

    // 3. Color scheme mặc định
    return getChartColor(index, colorScheme);
  };

  // Prepare chart data
  const chartData = sorted.map((it, index) => {
    const color = getItemColor(it, index);
    return {
      name: it.display ?? it.key,
      key: it.key,
      value: valueOf(it),
      percentage: overall > 0 ? (valueOf(it) / overall) * 100 : 0,
      done: effectiveMode === 'points' ? it.points?.done : it.counts.done,
      total: effectiveMode === 'points' ? it.points?.total : it.counts.total,
      fill: color,
      color: color, // ✅ Thêm color property cho Recharts
    };
  });

  // Chart config
  const chartConfig: ChartConfig = chartData.reduce(
    (acc, item) => ({
      ...acc,
      [item.key]: {
        label: item.name,
        color: item.fill,
      },
    }),
    {} as ChartConfig,
  );

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1'>
            <CardTitle className='text-base'>{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>

          <div className='flex items-center gap-2'>
            {showModeToggle && hasPoints && (
              <Tabs value={effectiveMode} onValueChange={(v) => setMetricMode(v as MetricMode)}>
                <TabsList className='h-7'>
                  <TabsTrigger value='counts' className='text-xs px-2 h-5'>
                    Issues
                  </TabsTrigger>
                  <TabsTrigger value='points' className='text-xs px-2 h-5'>
                    Points
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {showViewToggle && (
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className='h-7'>
                  <TabsTrigger value='bar' className='text-xs px-2 h-5'>
                    Bar
                  </TabsTrigger>
                  <TabsTrigger value='pie' className='text-xs px-2 h-5'>
                    Pie
                  </TabsTrigger>
                  <TabsTrigger value='list' className='text-xs px-2 h-5'>
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2 mt-2'>
          <Badge variant='secondary' className='font-mono'>
            Total: {fmt(overall)}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            {effectiveMode === 'points' ? 'points' : 'issues'}
          </span>
        </div>
      </CardHeader>

      <CardContent className='max-h-80 min-h-32 overflow-auto'>
        {sorted.length === 0 ? (
          <div className='text-sm text-muted-foreground py-8 text-center'>
            No breakdown data available.
          </div>
        ) : (
          <>
            {viewMode === 'bar' && (
              <BarChartView data={chartData} config={chartConfig} onSelect={onSelect} />
            )}
            {viewMode === 'pie' && (
              <PieChartView data={chartData} config={chartConfig} onSelect={onSelect} />
            )}
            {viewMode === 'list' && (
              <ListView data={chartData} effectiveMode={effectiveMode} onSelect={onSelect} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ✅ Bar Chart - sử dụng fill trực tiếp
function BarChartView({
  data,
  config,
  onSelect,
}: {
  data: Array<{
    name: string;
    key: string;
    value: number;
    percentage: number;
    fill: string;
  }>;
  config: ChartConfig;
  onSelect?: (key: string) => void;
}) {
  return (
    <ChartContainer config={config} className='h-[250px] w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} layout='vertical' margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type='number' hide />
          <YAxis
            dataKey='name'
            type='category'
            tickLine={false}
            axisLine={false}
            width={100}
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <div className='flex flex-col gap-1'>
                    <span className='font-medium'>{item.payload.name}</span>
                    <span>
                      {new Intl.NumberFormat().format(Number(value))} (
                      {item.payload.percentage.toFixed(1)}%)
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey='value'
            radius={[0, 4, 4, 0]}
            className='cursor-pointer'
            onClick={(data) => onSelect?.(data.key)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} stroke='none' />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// ✅ Pie Chart
function PieChartView({
  data,
  config,
  onSelect,
}: {
  data: Array<{
    name: string;
    key: string;
    value: number;
    percentage: number;
    fill: string;
  }>;
  config: ChartConfig;
  onSelect?: (key: string) => void;
}) {
  return (
    <div className='flex items-center gap-4'>
      <ChartContainer config={config} className='h-[200px] w-[200px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className='flex flex-col gap-1'>
                      <span className='font-medium'>{item.payload.name}</span>
                      <span>
                        {new Intl.NumberFormat().format(Number(value))} (
                        {item.payload.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey='value'
              nameKey='name'
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              className='cursor-pointer'
              onClick={(data) => onSelect?.(data.key)}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke='none' />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Legend */}
      <div className='flex flex-col gap-2 flex-1'>
        {data.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect?.(item.key)}
            className='flex items-center gap-2 text-left hover:bg-muted/50 rounded px-2 py-1 transition-colors'
          >
            <div className='w-3 h-3 rounded-sm shrink-0' style={{ backgroundColor: item.fill }} />
            <span className='text-sm truncate flex-1'>{item.name}</span>
            <span className='text-xs text-muted-foreground font-mono'>
              {item.percentage.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ✅ List View
function ListView({
  data,
  effectiveMode,
  onSelect,
}: {
  data: Array<{
    name: string;
    key: string;
    value: number;
    percentage: number;
    done?: number;
    total?: number;
    fill: string;
  }>;
  effectiveMode: MetricMode;
  onSelect?: (key: string) => void;
}) {
  const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));

  return (
    <div className='space-y-2'>
      {data.map((item) => {
        const showDone = typeof item.done === 'number' && Number.isFinite(item.done);

        return (
          <button
            key={item.key}
            type='button'
            onClick={() => onSelect?.(item.key)}
            className={cn(
              'w-full text-left rounded-lg border border-transparent',
              'hover:border-border hover:bg-muted/50 transition-all',
              'px-3 py-2. 5 group',
            )}
          >
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2 min-w-0'>
                <div
                  className='w-2 h-2 rounded-full shrink-0'
                  style={{ backgroundColor: item.fill }}
                />
                <div className='min-w-0'>
                  <div className='text-sm font-medium truncate group-hover:text-primary transition-colors'>
                    {item.name}
                  </div>
                  {showDone && (
                    <div className='text-xs text-muted-foreground mt-0.5'>
                      {fmt(item.done!)} / {fmt(item.total ?? 0)} done
                    </div>
                  )}
                </div>
              </div>

              <div className='text-right shrink-0'>
                <div className='text-sm font-semibold tabular-nums'>{fmt(item.value)}</div>
                <div className='text-xs text-muted-foreground'>{item.percentage.toFixed(0)}%</div>
              </div>
            </div>

            <div className='mt-2 h-1. 5 w-full rounded-full bg-muted overflow-hidden'>
              <div
                className='h-full rounded-full transition-all duration-300'
                style={{
                  width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                  backgroundColor: item.fill,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { getChartColor, getColorByKey, CHART_COLORS, SEMANTIC_COLORS };
