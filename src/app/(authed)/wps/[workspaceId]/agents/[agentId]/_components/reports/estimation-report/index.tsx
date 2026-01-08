'use client';

import { useState } from 'react';
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
  XCircle,
  BarChart3,
  Settings,
  Target,
  Code,
  Database,
  Zap,
  Layout,
  FileCode,
} from 'lucide-react';
import { EstimationReport as EstimationReportType } from './types';

interface EstimationReportPageProps {
  data: EstimationReportType;
}

export function EstimationReport({ data }: EstimationReportPageProps) {
  const [activeTab, setActiveTab] = useState('overview');

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

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold'>Project Estimation Report</h1>
        <p className='text-muted-foreground'>
          Comprehensive analysis and estimation for {data.document.filename}
        </p>
      </div>

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='models'>Models</TabsTrigger>
          <TabsTrigger value='analysis'>Analysis</TabsTrigger>
          <TabsTrigger value='requirements'>Requirements</TabsTrigger>
          <TabsTrigger value='document'>Document</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Features Summary */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5' />
                  Features Summary
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='text-sm text-muted-foreground'>Size</div>
                    <div className='text-lg font-semibold'>{data.analysis.features.size}</div>
                  </div>
                  <div>
                    <div className='text-sm text-muted-foreground'>Entities</div>
                    <div className='text-lg font-semibold'>{data.analysis.features.entities}</div>
                  </div>
                  <div>
                    <div className='text-sm text-muted-foreground'>Complexity</div>
                    <Progress value={data.analysis.features.complexity * 10} className='mt-1' />
                  </div>
                  <div>
                    <div className='text-sm text-muted-foreground'>Reliability</div>
                    <Progress value={data.analysis.features.reliability * 10} className='mt-1' />
                  </div>
                </div>
                <div>
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

            {/* Confidence Factors */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5' />
                  Confidence Factors
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {Object.entries(data.analysis.confidence.confidence_factors).map(([key, value]) => (
                  <div key={key} className='flex items-center justify-between'>
                    <span className='text-sm capitalize'>{key.replace(/_/g, ' ')}</span>
                    {value ? (
                      <CheckCircle className='h-4 w-4 text-green-500' />
                    ) : (
                      <XCircle className='h-4 w-4 text-red-500' />
                    )}
                  </div>
                ))}
                <Separator />
                <p className='text-sm text-muted-foreground'>
                  {data.analysis.confidence.confidence_explanation}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value='models' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Brain className='h-5 w-5' />
                Model Estimates
              </CardTitle>
              <CardDescription>
                Comparison of different estimation models and their confidence levels
              </CardDescription>
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
                    <TableCell className='font-medium'>
                      {data.estimation.model_estimates.function_points}
                    </TableCell>
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

        {/* Analysis Tab */}
        <TabsContent value='analysis' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* COCOMO Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>COCOMO Analysis</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {Object.entries(data.analysis.cocomo).map(([key, value]) => (
                  <div key={key} className='flex justify-between items-center'>
                    <span className='text-sm capitalize'>{key.replace(/_/g, ' ')}</span>
                    <div className='flex items-center gap-2'>
                      <Progress value={value * 10} className='w-16' />
                      <span className='text-sm font-medium w-8'>{value}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Function Points */}
            <Card>
              <CardHeader>
                <CardTitle>Function Points</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {Object.entries(data.analysis.function_points).map(([key, value]) => (
                  <div key={key} className='flex justify-between'>
                    <span className='text-sm capitalize'>{key.replace(/_/g, ' ')}</span>
                    <span className='font-medium'>{value}</span>
                  </div>
                ))}
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

        {/* Requirements Tab */}
        <TabsContent value='requirements' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileCode className='h-5 w-5' />
                Requirements Analysis
              </CardTitle>
              <CardDescription>
                Total of {data.analysis.requirements.length} requirements identified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
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
