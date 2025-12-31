/* eslint-disable react-hooks/incompatible-library */
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
import { Progress } from '@/components/ui/progress';
import { useForm, useWatch } from 'react-hook-form';
import React, { useState, useMemo, useEffect } from 'react';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Bot,
  Lightbulb,
  FileText,
  Settings,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { ZAIAgentCreateInput } from '@/contracts/agents/agent.input';
import { createAgentMutationOptions } from '../../api/actions';
import { cn } from '@/lib/utils';

// Enhanced schema with validation
export const ZCreateFormData = ZAIAgentCreateInput;
type CreateFormData = z.infer<typeof ZCreateFormData>;

type NewPageProps = {
  values: { workspaceId: string };
  onSubmit?: (data: CreateFormData) => void;
  onSuccess?: (data: CreateFormData & { id: string }) => void;
  mode?: 'create' | 'template';
  initialData?: Partial<CreateFormData>;
};

// Form steps for better UX
const FORM_STEPS = [
  { id: 'template', title: 'Choose Template', icon: Sparkles },
  { id: 'basic', title: 'Basic Info', icon: FileText },
  { id: 'instructions', title: 'Instructions', icon: Bot },
  { id: 'settings', title: 'Settings', icon: Settings },
] as const;

const AGENT_TEMPLATES = [
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Helpful customer service agent',
    instructions:
      'You are a friendly and helpful customer support agent. Always be polite, empathetic, and solution-oriented. Provide clear and concise answers to customer inquiries.',
    tags: ['support', 'customer-service'],
    color: 'bg-blue-500',
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'AI agent for data analysis and insights',
    instructions:
      'You are an expert data analyst. Help users understand their data, create visualizations, and provide actionable insights based on data patterns and trends.',
    tags: ['analytics', 'data', 'insights'],
    color: 'bg-green-500',
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'Creative writing and content creation agent',
    instructions:
      'You are a skilled content writer and copywriter. Create engaging, well-structured content that matches the requested tone and style. Focus on clarity and audience engagement.',
    tags: ['writing', 'content', 'marketing'],
    color: 'bg-purple-500',
  },
];

const AI_MODELS = [
  {
    value: 'gpt-4',
    label: 'GPT-4',
    description: 'Most capable model',
    badge: 'Recommended',
    badgeColor: 'bg-green-100 text-green-800',
  },
  {
    value: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    description: 'Faster and more cost-effective',
    badge: 'Popular',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    description: 'Good balance of speed and capability',
  },
  {
    value: 'claude-3',
    label: 'Claude 3',
    description: "Anthropic's latest model",
    badge: 'New',
    badgeColor: 'bg-orange-100 text-orange-800',
  },
];

export const CreateAgentForm = ({
  values,
  onSubmit,
  onSuccess,
  mode = 'create',
  initialData,
}: NewPageProps) => {
  const [currentStep, setCurrentStep] = useState(mode === 'template' ? 1 : 0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const form = useForm<CreateFormData>({
    resolver: zodResolver(ZCreateFormData),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      workspaceId: values.workspaceId,
      name: initialData?.name || '',
      description: initialData?.description || '',
      instructions: initialData?.instructions || '',
      tags: initialData?.tags || [],
      model: initialData?.model || 'gpt-4',
    },
  });

  const watchedValues = useWatch({ control: form.control });
  const createAgent = useMutation(createAgentMutationOptions());

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const requiredFields = ['name', 'description', 'instructions'];
    const completedFields = requiredFields.filter((field) =>
      watchedValues[field as keyof typeof watchedValues]?.toString().trim(),
    );
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }, [watchedValues]);

  // Auto-save draft to localStorage

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.values(watchedValues).some((val) => val)) {
        localStorage.setItem('agent-draft', JSON.stringify(watchedValues));
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [watchedValues]);

  const handleTemplateSelect = (template: (typeof AGENT_TEMPLATES)[0]) => {
    setSelectedTemplate(template.id);
    form.setValue('name', template.name);
    form.setValue('description', template.description);
    form.setValue('instructions', template.instructions);
    form.setValue('tags', template.tags);

    // Show success feedback
    toast.success(`Template "${template.name}" applied!`);

    // Move to next step
    setCurrentStep(1);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (onSubmit) onSubmit(data);

    try {
      const result = await createAgent.mutateAsync(data);
      toast.success('Agent created successfully!');
      localStorage.removeItem('agent-draft'); // Clear draft
      if (onSuccess) onSuccess(result.data);
    } catch (error: any) {
      toast.error(`Failed to create agent: ${error.message}`);
    }
  });

  const nextStep = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.watch('name') && form.watch('description');
      case 2:
        return form.watch('instructions');
      default:
        return true;
    }
  };

  const StepIndicator = () => (
    <div className='mb-8'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold'>Create Your Agent</h2>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <div className='flex items-center gap-1'>
            <div className='w-2 h-2 bg-primary rounded-full'></div>
            Progress: {formProgress}%
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        {FORM_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  'flex flex-col items-center gap-2 transition-colors',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-green-600',
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors',
                    isCurrent && 'border-primary bg-primary text-primary-foreground',
                    isCompleted && 'border-green-600 bg-green-600 text-white',
                    !isCurrent && !isCompleted && 'border-muted-foreground text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className='w-5 h-5' /> : <Icon className='w-5 h-5' />}
                </div>
                <span className='text-xs font-medium text-center'>{step.title}</span>
              </div>
              {index < FORM_STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-colors',
                    isCompleted ? 'bg-green-600' : 'bg-muted',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <Progress value={formProgress} className='mt-4' />
    </div>
  );

  return (
    <TooltipProvider>
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        <StepIndicator />

        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Step 0: Template Selection */}
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Sparkles className='h-5 w-5' />
                    Choose a Template (Optional)
                  </CardTitle>
                  <CardDescription>
                    Start with a pre-built template or skip to create from scratch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4 md:grid-cols-3 mb-6'>
                    {AGENT_TEMPLATES.map((template) => (
                      <Card
                        key={template.id}
                        className={cn(
                          'cursor-pointer transition-all duration-200 hover:shadow-lg border-2',
                          selectedTemplate === template.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50',
                        )}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-start justify-between'>
                            <div className={cn('w-3 h-3 rounded-full', template.color)} />
                            {selectedTemplate === template.id && (
                              <CheckCircle2 className='w-5 h-5 text-primary' />
                            )}
                          </div>
                          <CardTitle className='text-lg'>{template.name}</CardTitle>
                          <CardDescription className='text-sm line-clamp-2'>
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='pt-0'>
                          <div className='flex flex-wrap gap-1'>
                            {template.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant='secondary' className='text-xs'>
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 2 && (
                              <Badge variant='outline' className='text-xs'>
                                +{template.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className='flex justify-center'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setCurrentStep(1)}
                      className='min-w-[200px]'
                    >
                      Skip Templates
                      <ArrowRight className='ml-2 w-4 h-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Tell us about your agent</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {selectedTemplate && (
                    <Alert className='border-green-200 bg-green-50'>
                      <CheckCircle2 className='h-4 w-4 text-green-600' />
                      <AlertDescription className='text-green-800'>
                        Using template:{' '}
                        <strong>
                          {AGENT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                        </strong>
                        <Button
                          variant='link'
                          className='p-0 h-auto ml-2 text-green-700 hover:text-green-900'
                          onClick={() => {
                            setSelectedTemplate(null);
                            form.reset();
                          }}
                        >
                          Clear template
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

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
                                'text-lg pr-10',
                                field.value && !form.formState.errors.name && 'border-green-500',
                              )}
                            />
                            {field.value && !form.formState.errors.name && (
                              <CheckCircle2 className='absolute right-3 top-3 w-4 h-4 text-green-500' />
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
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
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Textarea
                              placeholder='Brief description of what your agent does...'
                              className={cn(
                                'resize-none',
                                field.value &&
                                  !form.formState.errors.description &&
                                  'border-green-500',
                              )}
                              rows={3}
                              {...field}
                            />
                            <div className='absolute bottom-2 right-2 text-xs text-muted-foreground'>
                              {field.value?.length || 0}/200
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          A short summary that helps users understand your agent&apos;s purpose
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Instructions */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Bot className='h-5 w-5' />
                    Agent Instructions
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
                          <Badge variant='outline' className='text-xs'>
                            {field.value?.length || 0} characters
                          </Badge>
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
                              'resize-none font-mono text-sm min-h-[200px]',
                              field.value &&
                                !form.formState.errors.instructions &&
                                'border-green-500',
                            )}
                            rows={10}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className='flex items-start gap-2'>
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
            )}

            {/* Step 3: Settings */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Settings className='h-5 w-5' />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>Configure additional options and preferences</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='model'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className='h-auto'>
                              <SelectValue placeholder='Select AI model' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AI_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value} className='py-3'>
                                <div className='flex items-center justify-between w-full'>
                                  <div>
                                    <div className='font-medium'>{model.label}</div>
                                    <div className='text-xs text-muted-foreground'>
                                      {model.description}
                                    </div>
                                  </div>
                                  {model.badge && (
                                    <Badge className={cn('ml-2 text-xs', model.badgeColor)}>
                                      {model.badge}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Summary Card */}
                  <Card className='bg-muted/50'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-lg'>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium'>Agent Name:</span>
                        <span className='text-sm'>{form.watch('name') || 'Not set'}</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium'>Model:</span>
                        <span className='text-sm'>{form.watch('model')}</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium'>Instructions:</span>
                        <span className='text-sm'>
                          {form.watch('instructions')?.length || 0} characters
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className='flex items-center justify-between pt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={prevStep}
                disabled={currentStep === 0}
                className='min-w-[120px]'
              >
                <ArrowLeft className='mr-2 w-4 h-4' />
                Previous
              </Button>

              <div className='flex items-center gap-3'>
                {currentStep === FORM_STEPS.length - 1 ? (
                  <>
                    <Button type='button' variant='outline' onClick={() => form.reset()}>
                      Reset Form
                    </Button>
                    <Button
                      type='submit'
                      className='min-w-[140px]'
                      disabled={form.formState.isSubmitting || !form.formState.isValid}
                    >
                      {form.formState.isSubmitting && (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      )}
                      {form.formState.isSubmitting ? 'Creating...' : 'Create Agent'}
                    </Button>
                  </>
                ) : (
                  <Button
                    type='button'
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className='min-w-[120px]'
                  >
                    Next
                    <ArrowRight className='ml-2 w-4 h-4' />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </TooltipProvider>
  );
};
