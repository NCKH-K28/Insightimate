'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Clock,
  Users,
  TrendingUp,
  Brain,
  CheckCircle,
  BarChart3,
  Settings,
  Target,
  Code,
  Database,
  Zap,
  Layout,
  FileCode,
} from 'lucide-react';
import { EstimationReport as EstimationReportType } from '@/lib/insight-ai/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';

interface EstimationReportPageProps {
  data: EstimationReportType;
  tab?: string;
  onTabChange?: (tab: string) => void;
}

export function EstimationReport({ data, tab, onTabChange }: EstimationReportPageProps) {
  const [internalActiveTab, setActiveTab] = useState<string>(tab ?? 'overview');

  const activeTab = useMemo(() => {
    return tab ?? internalActiveTab;
  }, [tab, internalActiveTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Colors for charts
  const COLORS = {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    purple: '#a855f7',
    cyan: '#06b6d4',
  };

  const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.cyan];

  const getConfidenceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'functional':
        return <Code className='h-4 w-4' />;
      case 'non_functional':
        return <Settings className='h-4 w-4' />;
      case 'interface':
        return <Layout className='h-4 w-4' />;
      case 'data':
        return <Database className='h-4 w-4' />;
      case 'performance':
        return <Zap className='h-4 w-4' />;
      default:
        return <FileCode className='h-4 w-4' />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  // Prepare chart data
  const modelEstimatesChartData = [
    {
      name: 'COCOMO',
      hours: data.estimation.model_estimates.cocomo,
      confidence: data.estimation.model_estimates.cocomo_confidence,
    },
    {
      name: 'Function Points',
      hours: data.estimation.model_estimates.function_points,
      confidence: data.estimation.model_estimates.function_points_confidence,
    },
    {
      name: 'Random Forest',
      hours: data.estimation.model_estimates.ml_Random_Forest,
      confidence: data.estimation.model_estimates.ml_Random_Forest_confidence,
    },
    {
      name: 'Linear Regression',
      hours: data.estimation.model_estimates.ml_Linear_Regression,
      confidence: data.estimation.model_estimates.ml_Linear_Regression_confidence,
    },
  ];

  const cocomoRadarData = Object.entries(data.analysis.cocomo).map(([key, value]) => ({
    metric: key.replace(/_/g, ' '),
    value: value,
  }));

  const functionPointsData = Object.entries(data.analysis.function_points).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    value: value,
  }));

  const requirementsByType = data.analysis.requirements.reduce(
    (acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const requirementsPieData = Object.entries(requirementsByType).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count,
  }));

  const confidenceFactorsData = Object.entries(data.analysis.confidence.confidence_factors).map(
    ([key, value]) => ({
      name: key.replace(/_/g, ' '),
      value: value ? 1 : 0,
      status: value,
    }),
  );

  const featureMetricsData = [
    { name: 'Size', value: data.analysis.features.size },
    { name: 'Entities', value: data.analysis.features.entities },
    { name: 'Complexity', value: data.analysis.features.complexity },
    { name: 'Reliability', value: data.analysis.features.reliability },
  ];

  return (
    <div className='container mx-auto space-y-6'>
      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Duration</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.estimation.duration} months</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Team Size</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.estimation.team_size} developers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Effort</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(data.estimation.total_effort)} hours
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Confidence</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-3 h-3 rounded-full ${getConfidenceColor(
                  data.estimation.confidence_level,
                )}`}
              ></div>
              <span className='text-2xl font-bold'>{data.estimation.confidence_level}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='models'>Models</TabsTrigger>
          <TabsTrigger value='analysis'>Analysis</TabsTrigger>
          <TabsTrigger value='requirements'>Requirements</TabsTrigger>
          <TabsTrigger value='document'>Document</TabsTrigger>
        </TabsList>

        {/* Overview Tab - WITH CHARTS */}
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Features Metrics Chart */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5' />
                  Features Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <BarChart data={featureMetricsData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='value' fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className='mt-4'>
                  <div className='text-sm text-muted-foreground mb-2'>Technologies</div>
                  <div className='flex flex-wrap gap-1'>
                    {data.analysis.features.technologies.map((tech, index) => (
                      <Badge key={index} variant='secondary'>
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confidence Factors Chart */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5' />
                  Confidence Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <BarChart data={confidenceFactorsData} layout='vertical' margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' domain={[0, 1]} />
                    <YAxis type='category' dataKey='name' width={100} />
                    <Tooltip />
                    <Bar dataKey='value' radius={[0, 8, 8, 0]}>
                      {confidenceFactorsData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.status ? COLORS.success : COLORS.danger}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Separator className='my-3' />
                <p className='text-sm text-muted-foreground'>
                  {data.analysis.confidence.confidence_explanation}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab - WITH COMPARISON CHART */}
        <TabsContent value='models' className='space-y-4'>
          {/* Model Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Brain className='h-5 w-5' />
                Model Estimates Comparison
              </CardTitle>
              <CardDescription>
                Visual comparison of effort estimates and confidence levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={350}>
                <ComposedChart data={modelEstimatesChartData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis
                    yAxisId='left'
                    label={{
                      value: 'Hours',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    label={{
                      value: 'Confidence %',
                      angle: 90,
                      position: 'insideRight',
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId='left'
                    dataKey='hours'
                    fill={COLORS.primary}
                    name='Estimated Hours'
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='confidence'
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name='Confidence %'
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Model Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Estimate (hours)</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className='font-medium'>
                      {data.estimation.model_estimates.cocomo_name}
                    </TableCell>
                    <TableCell>{data.estimation.model_estimates.cocomo_type}</TableCell>
                    <TableCell>{formatNumber(data.estimation.model_estimates.cocomo)}</TableCell>
                    <TableCell>
                      <Progress
                        value={data.estimation.model_estimates.cocomo_confidence}
                        className='w-16'
                      />
                    </TableCell>
                    <TableCell className='max-w-xs truncate'>
                      {data.estimation.model_estimates.cocomo_description}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Function Points</TableCell>
                    <TableCell>Function Points</TableCell>
                    <TableCell>
                      {formatNumber(data.estimation.model_estimates.function_points)}
                    </TableCell>
                    <TableCell>
                      <Progress
                        value={data.estimation.model_estimates.function_points_confidence}
                        className='w-16'
                      />
                    </TableCell>
                    <TableCell className='max-w-xs truncate'>
                      {data.estimation.model_estimates.function_points_description}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>
                      {data.estimation.model_estimates.ml_Random_Forest_name}
                    </TableCell>
                    <TableCell>{data.estimation.model_estimates.ml_Random_Forest_type}</TableCell>
                    <TableCell>
                      {formatNumber(data.estimation.model_estimates.ml_Random_Forest)}
                    </TableCell>
                    <TableCell>
                      <Progress
                        value={data.estimation.model_estimates.ml_Random_Forest_confidence}
                        className='w-16'
                      />
                    </TableCell>
                    <TableCell className='max-w-xs truncate'>
                      {data.estimation.model_estimates.ml_Random_Forest_description}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>
                      {data.estimation.model_estimates.ml_Linear_Regression_name}
                    </TableCell>
                    <TableCell>
                      {data.estimation.model_estimates.ml_Linear_Regression_type}
                    </TableCell>
                    <TableCell>
                      {formatNumber(data.estimation.model_estimates.ml_Linear_Regression)}
                    </TableCell>
                    <TableCell>
                      <Progress
                        value={data.estimation.model_estimates.ml_Linear_Regression_confidence}
                        className='w-16'
                      />
                    </TableCell>
                    <TableCell className='max-w-xs truncate'>
                      {data.estimation.model_estimates.ml_Linear_Regression_description}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab - WITH RADAR AND BAR CHARTS */}
        <TabsContent value='analysis' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* COCOMO Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>COCOMO Analysis</CardTitle>
                <CardDescription>Multi-dimensional view of COCOMO metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <RadarChart data={cocomoRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey='metric' />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                    <Radar
                      name='COCOMO'
                      dataKey='value'
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Function Points Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Function Points Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={functionPointsData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' angle={-45} textAnchor='end' height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='value' fill={COLORS.success} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Use Case Points */}
            <Card>
              <CardHeader>
                <CardTitle>Use Case Points</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {Object.entries(data.analysis.use_case_points).map(([key, value]) => (
                  <div key={key} className='flex justify-between'>
                    <span className='text-sm capitalize'>{key.replace(/_/g, ' ')}</span>
                    <span className='font-medium'>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* LOC Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Lines of Code Analysis</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {Object.entries(data.analysis.loc_linear).map(([key, value]) => (
                  <div key={key} className='flex justify-between'>
                    <span className='text-sm capitalize'>{key.replace(/_/g, ' ')}</span>
                    <span className='font-medium'>{formatNumber(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Requirements Tab - WITH PIE CHART */}
        <TabsContent value='requirements' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Requirements Distribution Pie Chart */}
            <Card className='lg:col-span-1'>
              <CardHeader>
                <CardTitle>Requirements by Type</CardTitle>
                <CardDescription>
                  Total: {data.analysis.requirements.length} requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={requirementsPieData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {requirementsPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Requirements List */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileCode className='h-5 w-5' />
                  Requirements Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-[400px] overflow-y-auto'>
                  {data.analysis.requirements.map((req) => (
                    <div key={req.id} className='border rounded-lg p-3'>
                      <div className='flex items-center gap-2 mb-2'>
                        {getRequirementIcon(req.type)}
                        <Badge variant='outline' className='capitalize'>
                          {req.type.replace(/_/g, ' ')}
                        </Badge>
                        <span className='text-xs text-muted-foreground'>#{req.id}</span>
                      </div>
                      <p className='text-sm'>{req.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Document Tab */}
        <TabsContent value='document' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm text-muted-foreground'>Filename</div>
                  <div className='font-medium'>{data.document.filename}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>File Type</div>
                  <div className='font-medium'>{data.document.file_type}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>File Size</div>
                  <div className='font-medium'>{formatBytes(data.document.size_bytes)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Text Length</div>
                  <div className='font-medium'>
                    {formatNumber(data.document.text_length)} characters
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EstimationReport;
