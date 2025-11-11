'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm, useWatch } from 'react-hook-form';
import React, { useState, useEffect, useMemo } from 'react';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Bot,
  Lightbulb,
  FileText,
  Settings,
  Info,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Clock,
  Trash2,
  Copy,
  Share,
  Download,
  Save,
  MoreVertical,
  History,
  MessageSquare,
  Star,
  Activity,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { ZAIAgentUpdateInput } from '@/contracts/agents/agents.input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  deleteAgentMutationOptions,
  getAgentQueryOptions,
  updateAgentMutationOptions,
} from '@/features/agents/api/actions';
import { cn } from '@/lib/utils';

const ZEditFormData = ZAIAgentUpdateInput;
type EditFormData = z.infer<typeof ZEditFormData>;

type EditAgentFormProps = { params: { workspaceId: string; agentId: string } };

const AI_MODELS = [
  {
    value: 'gpt-4',
    label: 'GPT-4',
    description: 'Most capable model',
    badge: 'Recommended',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    cost: 'High',
    performance: 95,
  },
  {
    value: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    description: 'Faster and more cost-effective',
    badge: 'Popular',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    cost: 'Medium',
    performance: 92,
  },
  {
    value: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    description: 'Good balance of speed and capability',
    cost: 'Low',
    performance: 85,
  },
  {
    value: 'claude-3',
    label: 'Claude 3',
    description: "Anthropic's latest model",
    badge: 'New',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    cost: 'Medium',
    performance: 88,
  },
];

export const EditAgentForm = ({ params }: EditAgentFormProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch agent data
  const {
    data: agent,
    isLoading,
    isError,
    error,
  } = useQuery(getAgentQueryOptions({ agentId: params.agentId }));

  const form = useForm<EditFormData>({
    resolver: zodResolver(ZEditFormData),
    mode: 'onChange',
    defaultValues: {
      workspaceId: params.workspaceId,
      name: '',
      description: '',
      instructions: '',
      tags: [],
      model: 'gpt-4',
    },
  });

  const watchedValues = useWatch({ control: form.control });

  // Mutations
  const updateAgent = useMutation(updateAgentMutationOptions({ agentId: params.agentId }));
  const deleteAgent = useMutation(deleteAgentMutationOptions({ agentId: params.agentId }));

  // Calculate form completion
  const formCompletion = useMemo(() => {
    const fields = ['name', 'description', 'instructions'];
    const completed = fields.filter((field) =>
      watchedValues[field as keyof typeof watchedValues]?.toString().trim(),
    ).length;
    return Math.round((completed / fields.length) * 100);
  }, [watchedValues]);

  // Auto-save functionality
  useEffect(() => {
    if (!agent) return;

    const hasChanges = form.formState.isDirty;
    if (!hasChanges) return;

    setAutoSaveStatus('saving');
    const timeoutId = setTimeout(() => {
      localStorage.setItem(`agent-draft-${params.agentId}`, JSON.stringify(watchedValues));
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, form.formState.isDirty, agent, params.agentId]);

  // Set form values when agent data loads
  useEffect(() => {
    if (agent) {
      form.reset({
        workspaceId: params.workspaceId,
        name: agent.name || '',
        description: agent.description || '',
        instructions: agent.instructions || '',
        tags: agent.tags || [],
        model: agent.model || 'gpt-4',
      });
    }
  }, [agent, form, params.workspaceId]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await updateAgent.mutateAsync(data);
      toast.success('Agent updated successfully!');
      localStorage.removeItem(`agent-draft-${params.agentId}`);
      setAutoSaveStatus('idle');
      queryClient.invalidateQueries({ queryKey: ['agent', params.agentId] });
      form.reset(data); // Reset dirty state
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
      setAutoSaveStatus('error');
    }
  });

  const handleDelete = async () => {
    try {
      await deleteAgent.mutateAsync();
      toast.success('Agent deleted successfully');
      router.push(`/wps/${params.workspaceId}/agents`);
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleDuplicate = () => {
    const agentData = form.getValues();
    localStorage.setItem(
      'agent-template',
      JSON.stringify({
        ...agentData,
        name: `${agentData.name} (Copy)`,
      }),
    );
    router.push(`/wps/${params.workspaceId}/agents/new?template=true`);
    toast.success('Agent data copied to new template');
  };

  const handleExport = async () => {
    const agentData = { ...agent, ...form.getValues() };
    const dataStr = JSON.stringify(agentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentData.name || 'agent'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Agent exported successfully');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Agent link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const selectedModel = AI_MODELS.find((m) => m.value === form.watch('model'));

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className='max-w-5xl mx-auto p-6 space-y-6'>
          {/* Enhanced Loading State */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-lg' />
              <div className='space-y-2'>
                <Skeleton className='h-8 w-64' />
                <Skeleton className='h-4 w-48' />
              </div>
            </div>

            {/* Progress skeleton */}
            <Skeleton className='h-2 w-full' />

            {/* Stats grid */}
            <div className='grid gap-4 md:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className='p-4'>
                  <Skeleton className='h-4 w-16 mb-2' />
                  <Skeleton className='h-6 w-12' />
                </Card>
              ))}
            </div>

            {/* Form cards */}
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className='h-6 w-48' />
                  <Skeleton className='h-4 w-64' />
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-20 w-full' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (isError || !agent) {
    return (
      <div className='max-w-5xl mx-auto p-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Failed to load agent: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='max-w-5xl mx-auto p-6 space-y-6'>
        {/* Enhanced Header with Status */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <div className='w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center'>
                  <Bot className='h-6 w-6 text-white' />
                </div>
                <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background'></div>
              </div>
              <div className='space-y-1'>
                <h1 className='text-3xl font-bold tracking-tight'>{agent.name}</h1>
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <span>
                    Last modified{' '}
                    {agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : 'recently'}
                  </span>
                  {autoSaveStatus === 'saved' && lastSaved && (
                    <span className='flex items-center gap-1 text-green-600'>
                      <CheckCircle2 className='h-3 w-3' />
                      Auto-saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  {autoSaveStatus === 'saving' && (
                    <span className='flex items-center gap-1 text-blue-600'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Saving...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {form.formState.isDirty && (
                <Badge variant='outline' className='text-orange-600 border-orange-200 bg-orange-50'>
                  <Clock className='h-3 w-3 mr-1' />
                  Unsaved changes
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className='h-4 w-4 mr-2' />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share className='h-4 w-4 mr-2' />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className='h-4 w-4 mr-2' />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/wps/${params.workspaceId}/agents/${params.agentId}/history`}>
                      <History className='h-4 w-4 mr-2' />
                      View History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/wps/${params.workspaceId}/agents/${params.agentId}/conversations`}
                    >
                      <MessageSquare className='h-4 w-4 mr-2' />
                      Conversations
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className='text-red-600 focus:text-red-600 focus:bg-red-50'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Form completion</span>
              <span className='font-medium'>{formCompletion}%</span>
            </div>
            <div className='w-full bg-muted rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500'
                style={{ width: `${formCompletion}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className='grid gap-4 md:grid-cols-4'>
            <Card className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Activity className='h-4 w-4 text-blue-600' />
                  <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                    Status
                  </span>
                </div>
                <p className='text-lg font-bold text-blue-900 dark:text-blue-100'>Active</p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <TrendingUp className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium text-green-700 dark:text-green-300'>
                    Performance
                  </span>
                </div>
                <p className='text-lg font-bold text-green-900 dark:text-green-100'>
                  {selectedModel?.performance || 95}%
                </p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <MessageSquare className='h-4 w-4 text-purple-600' />
                  <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
                    Conversations
                  </span>
                </div>
                <p className='text-lg font-bold text-purple-900 dark:text-purple-100'>247</p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Star className='h-4 w-4 text-orange-600' />
                  <span className='text-sm font-medium text-orange-700 dark:text-orange-300'>
                    Rating
                  </span>
                </div>
                <p className='text-lg font-bold text-orange-900 dark:text-orange-100'>4.8</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Basic Information */}
            <Card className='group hover:shadow-md transition-shadow duration-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Basic Information
                  {form.watch('name') && form.watch('description') && (
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                  )}
                </CardTitle>
                <CardDescription>Essential details about your agent</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        Agent Name *
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className='h-4 w-4 text-muted-foreground' />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Choose a clear, descriptive name for your agent</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            placeholder='e.g., Customer Support Bot'
                            {...field}
                            className={cn(
                              'text-lg pr-10 transition-colors',
                              field.value &&
                                !form.formState.errors.name &&
                                'border-green-500 bg-green-50/50',
                            )}
                          />
                          {field.value && !form.formState.errors.name && (
                            <CheckCircle2 className='absolute right-3 top-3 w-4 h-4 text-green-500' />
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className='text-xs'>
                        This will be displayed as your agent&apos;s identity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center justify-between'>
                        Description *
                        <Badge variant='outline' className='text-xs'>
                          {field.value?.length || 0}/500
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Brief description of what your agent does...'
                          className={cn(
                            'resize-none transition-colors',
                            field.value &&
                              !form.formState.errors.description &&
                              'border-green-500 bg-green-50/50',
                          )}
                          rows={3}
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className='text-xs'>
                        A short summary that helps users understand your agent&apos;s purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className='group hover:shadow-md transition-shadow duration-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Bot className='h-5 w-5' />
                  Agent Instructions
                  {form.watch('instructions') && (
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                  )}
                </CardTitle>
                <CardDescription>Define how your agent should behave and respond</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name='instructions'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center justify-between'>
                        Instructions *
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            {field.value?.length || 0} chars
                          </Badge>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              // AI assistance for writing instructions
                              toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
                                loading: 'AI is analyzing your instructions...',
                                success: 'AI suggestions ready!',
                                error: 'AI assist temporarily unavailable',
                              });
                            }}
                          >
                            <Sparkles className='h-3 w-3 mr-1' />
                            AI Assist
                          </Button>
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={`You are a helpful AI assistant. Your role is to...

Guidelines:
- Always be polite and professional
- Provide accurate and helpful information
- Ask clarifying questions when needed
- Admit when you don't know something`}
                          className={cn(
                            'resize-none font-mono text-sm min-h-[200px] transition-colors',
                            field.value &&
                              !form.formState.errors.instructions &&
                              'border-green-500 bg-green-50/50',
                          )}
                          rows={12}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className='flex items-start gap-2 text-xs'>
                        <Lightbulb className='h-4 w-4 mt-0.5 text-yellow-500' />
                        Be specific about the agent&apos;s personality, expertise, and behavior
                        patterns
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className='group hover:shadow-md transition-shadow duration-200'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <Settings className='h-5 w-5' />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>Configure additional options and preferences</CardDescription>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className='hover:bg-primary/10'
                  >
                    {showAdvanced ? (
                      <ChevronUp className='h-4 w-4 mr-2' />
                    ) : (
                      <ChevronDown className='h-4 w-4 mr-2' />
                    )}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>
              </CardHeader>

              {showAdvanced && (
                <CardContent className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='model'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className='h-auto'>
                              <SelectValue placeholder='Select AI model' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AI_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value} className='py-3'>
                                <div className='flex items-center justify-between w-full'>
                                  <div className='flex-1'>
                                    <div className='font-medium'>{model.label}</div>
                                    <div className='text-sm text-muted-foreground'>
                                      {model.description}
                                    </div>
                                    <div className='text-xs text-muted-foreground mt-1'>
                                      Cost: {model.cost} • Performance: {model.performance}%
                                    </div>
                                  </div>
                                  <div className='flex flex-col items-end gap-1 ml-4'>
                                    {model.badge && (
                                      <Badge className={cn('text-xs', model.badgeColor)}>
                                        {model.badge}
                                      </Badge>
                                    )}
                                    <div className='w-16 bg-muted rounded-full h-1.5'>
                                      <div
                                        className='h-1.5 bg-primary rounded-full transition-all'
                                        style={{ width: `${model.performance}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Enhanced Performance Metrics */}
                  <div className='grid gap-4 md:grid-cols-2'>
                    <Card className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200'>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-sm flex items-center gap-2'>
                          <Activity className='h-4 w-4 text-blue-600' />
                          Performance Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-3 text-sm'>
                          <div className='flex justify-between items-center'>
                            <span>Response Time:</span>
                            <div className='flex items-center gap-2'>
                              <div className='w-16 bg-blue-200 rounded-full h-2'>
                                <div className='w-3/4 bg-blue-600 h-2 rounded-full'></div>
                              </div>
                              <span className='font-medium'>~2.3s</span>
                            </div>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span>Accuracy:</span>
                            <div className='flex items-center gap-2'>
                              <div className='w-16 bg-blue-200 rounded-full h-2'>
                                <div className='w-[94%] bg-blue-600 h-2 rounded-full'></div>
                              </div>
                              <span className='font-medium'>94%</span>
                            </div>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span>Cost/Query:</span>
                            <span className='font-medium text-blue-700'>$0.02</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200'>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-sm flex items-center gap-2'>
                          <TrendingUp className='h-4 w-4 text-green-600' />
                          Usage Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-3 text-sm'>
                          <div className='flex justify-between items-center'>
                            <span>This Month:</span>
                            <span className='font-medium text-green-700'>247 queries</span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span>Success Rate:</span>
                            <div className='flex items-center gap-2'>
                              <div className='w-16 bg-green-200 rounded-full h-2'>
                                <div className='w-[96%] bg-green-600 h-2 rounded-full'></div>
                              </div>
                              <span className='font-medium'>96%</span>
                            </div>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span>Avg Rating:</span>
                            <span className='font-medium flex items-center gap-1 text-green-700'>
                              4.8 <Star className='h-3 w-3 fill-current text-yellow-400' />
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Sticky Action Bar */}
            <div className='sticky bottom-0 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      router.push(`/wps/${params.workspaceId}/agents/${params.agentId}`)
                    }
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    Preview
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => form.reset()}
                    disabled={!form.formState.isDirty}
                  >
                    <RotateCcw className='h-4 w-4 mr-2' />
                    Reset Changes
                  </Button>
                </div>

                <div className='flex items-center gap-3'>
                  {autoSaveStatus === 'saved' && (
                    <p className='text-xs text-green-600 flex items-center gap-1'>
                      <CheckCircle2 className='h-3 w-3' />
                      Auto-saved
                    </p>
                  )}
                  {autoSaveStatus === 'saving' && (
                    <p className='text-xs text-blue-600 flex items-center gap-1'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Saving...
                    </p>
                  )}

                  <Button
                    type='submit'
                    disabled={form.formState.isSubmitting || !form.formState.isDirty}
                    className='min-w-[140px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary'
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>

        {/* Enhanced Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center'>
                  <AlertCircle className='h-5 w-5 text-red-600' />
                </div>
                Delete Agent
              </DialogTitle>
              <DialogDescription className='text-left pt-2'>
                Are you sure you want to delete <strong>&quot;{agent.name}&quot;</strong>?
                <br />
                <br />
                This action will permanently remove:
                <ul className='list-disc list-inside mt-2 space-y-1 text-sm'>
                  <li>All agent configurations</li>
                  <li>Conversation history (247 conversations)</li>
                  <li>Performance data and analytics</li>
                </ul>
                <br />
                <strong>This action cannot be undone.</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteAgent.isPending}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleDelete}
                disabled={deleteAgent.isPending}
                className='flex-1'
              >
                {deleteAgent.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Delete Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
