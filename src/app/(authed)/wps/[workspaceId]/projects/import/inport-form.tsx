'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Schemas với validation lỏng hơn cho import
const ZProjectRole = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  permissions: z.array(z.string()).default([]),
});

const ZIssueType = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  icon: z.string().nullable().default(null),
  color: z.string().nullable().default(null),
});

const ZIssuePriority = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  icon: z.string().nullable().default(null),
  color: z.string().nullable().default(null),
  order: z.number().default(0),
});

const ZIssueStatus = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  color: z.string().nullable().default(null),
  order: z.number().default(0),
  category: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
});

const ZIssue = z.object({
  id: z.string().min(1, 'ID is required'),
  key: z.string().min(1, 'Key is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().default(null),
  typeId: z.string().min(1, 'Type is required'),
  statusId: z.string().min(1, 'Status is required'),
  priorityId: z.string().nullable().default(null),
  assigneeId: z.string().nullable().default(null),
  reporterId: z.string().min(1, 'Reporter is required'),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

const ZActor = z.object({
  actorId: z.string().min(1, 'Actor ID is required'),
  actorType: z.enum(['USER']).default('USER'),
  roleId: z.string().min(1, 'Role ID is required'),
});

export const ZProjectImport = z.object({
  metadata: z.any().default({}),
  project: z.object({
    id: z.string().min(1, 'Project ID is required'),
    key: z
      .string()
      .min(1, 'Project key is required')
      .max(10, 'Project key must be 10 characters or less'),
    name: z.string().min(1, 'Project name is required'),
    description: z.string().nullable().default(null),
    avatar: z.string().nullable().default(null),
    createdAt: z.string().default(() => new Date().toISOString()),
    updatedAt: z.string().default(() => new Date().toISOString()),
    leadId: z.string().min(1, 'Lead ID is required'),
    actors: z.array(ZActor).default([]),
    roles: z.array(ZProjectRole).default([]),
    types: z.array(ZIssueType).default([]),
    priorities: z.array(ZIssuePriority).default([]),
    statuses: z.array(ZIssueStatus).default([]),
    issues: z.array(ZIssue).default([]),
  }),
});

type ProjectImportFormValues = z.infer<typeof ZProjectImport>;

interface FieldValidationStatus {
  field: string;
  status: 'valid' | 'warning' | 'error';
  message?: string;
  count?: { valid: number; invalid: number };
}

interface ProjectImportFormProps {
  onSubmit: (data: ProjectImportFormValues) => Promise<void>;
  onCancel?: () => void;
}

// Component hiển thị trạng thái validation
function ValidationStatusBadge({ status }: { status: 'valid' | 'warning' | 'error' }) {
  if (status === 'valid') {
    return (
      <Badge variant='default' className='bg-green-500 hover:bg-green-600'>
        <CheckCircle2 className='w-3 h-3 mr-1' />
        Valid
      </Badge>
    );
  }
  if (status === 'warning') {
    return (
      <Badge variant='default' className='bg-yellow-500 hover:bg-yellow-600'>
        <AlertTriangle className='w-3 h-3 mr-1' />
        Warning
      </Badge>
    );
  }
  return (
    <Badge variant='destructive'>
      <XCircle className='w-3 h-3 mr-1' />
      Error
    </Badge>
  );
}

export function ProjectImportForm({ onSubmit, onCancel }: ProjectImportFormProps) {
  const [rawImportData, setRawImportData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationStatuses, setValidationStatuses] = useState<FieldValidationStatus[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const form = useForm<ProjectImportFormValues>({
    resolver: zodResolver(ZProjectImport),
    mode: 'onChange',
    defaultValues: {
      metadata: {},
      project: {
        id: '',
        key: '',
        name: '',
        description: null,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        leadId: '',
        actors: [],
        roles: [],
        types: [],
        priorities: [],
        statuses: [],
        issues: [],
      },
    },
  });

  const {
    fields: roleFields,
    remove: removeRole,
    replace: replaceRoles,
  } = useFieldArray({
    control: form.control,
    name: 'project.roles',
  });

  const {
    fields: typeFields,
    remove: removeType,
    replace: replaceTypes,
  } = useFieldArray({
    control: form.control,
    name: 'project. types',
  });

  const {
    fields: priorityFields,
    remove: removePriority,
    replace: replacePriorities,
  } = useFieldArray({
    control: form.control,
    name: 'project.priorities',
  });

  const {
    fields: statusFields,
    remove: removeStatus,
    replace: replaceStatuses,
  } = useFieldArray({
    control: form.control,
    name: 'project.statuses',
  });

  const {
    fields: issueFields,
    remove: removeIssue,
    replace: replaceIssues,
  } = useFieldArray({
    control: form.control,
    name: 'project. issues',
  });

  const {
    fields: actorFields,
    remove: removeActor,
    replace: replaceActors,
  } = useFieldArray({
    control: form.control,
    name: 'project.actors',
  });

  // Validate từng phần và trả về status
  const validateSection = useCallback(
    (schema: z.ZodSchema, data: any[], sectionName: string): FieldValidationStatus => {
      if (!data || data.length === 0) {
        return { field: sectionName, status: 'valid', count: { valid: 0, invalid: 0 } };
      }

      let validCount = 0;
      let invalidCount = 0;

      data.forEach((item) => {
        const result = schema.safeParse(item);
        if (result.success) {
          validCount++;
        } else {
          invalidCount++;
        }
      });

      if (invalidCount === 0) {
        return {
          field: sectionName,
          status: 'valid',
          count: { valid: validCount, invalid: 0 },
        };
      } else if (validCount > 0) {
        return {
          field: sectionName,
          status: 'warning',
          message: `${invalidCount} items have validation errors`,
          count: { valid: validCount, invalid: invalidCount },
        };
      } else {
        return {
          field: sectionName,
          status: 'error',
          message: 'All items have validation errors',
          count: { valid: 0, invalid: invalidCount },
        };
      }
    },
    [],
  );

  // Parse và validate dữ liệu import
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setParseError(null);
      setValidationStatuses([]);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          setRawImportData(parsed);

          // Tạo default values cho các field missing
          const projectData = parsed.project || {};
          const normalizedData: ProjectImportFormValues = {
            metadata: parsed.metadata || {},
            project: {
              id: projectData.id || crypto.randomUUID(),
              key: projectData.key || '',
              name: projectData.name || '',
              description: projectData.description || null,
              avatar: projectData.avatar || null,
              createdAt: projectData.createdAt || new Date().toISOString(),
              updatedAt: projectData.updatedAt || new Date().toISOString(),
              leadId: projectData.leadId || '',
              actors: projectData.actors || [],
              roles: projectData.roles || [],
              types: projectData.types || [],
              priorities: projectData.priorities || [],
              statuses: projectData.statuses || [],
              issues: projectData.issues || [],
            },
          };

          // Validate từng section
          const statuses: FieldValidationStatus[] = [
            validateSection(ZProjectRole, normalizedData.project.roles, 'roles'),
            validateSection(ZIssueType, normalizedData.project.types, 'types'),
            validateSection(ZIssuePriority, normalizedData.project.priorities, 'priorities'),
            validateSection(ZIssueStatus, normalizedData.project.statuses, 'statuses'),
            validateSection(ZIssue, normalizedData.project.issues, 'issues'),
            validateSection(ZActor, normalizedData.project.actors, 'actors'),
          ];

          setValidationStatuses(statuses);

          // Tự động expand các section có lỗi
          const sectionsWithErrors = statuses
            .filter((s) => s.status !== 'valid')
            .map((s) => s.field);
          setExpandedSections(sectionsWithErrors);

          // Reset form với dữ liệu đã normalize
          form.reset(normalizedData);
        } catch (error) {
          if (error instanceof SyntaxError) {
            setParseError('Invalid JSON format.  Please check your file.');
          } else {
            setParseError('Failed to parse the import file.');
          }
          setRawImportData(null);
        }
      };
      reader.readAsText(file);
    },
    [form, validateSection],
  );

  const handleSubmit = async (data: ProjectImportFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra lỗi của từng item trong array
  const getItemErrors = (basePath: string, index: number) => {
    const errors = form.formState.errors;
    const pathParts = basePath.split('.');
    let current: any = errors;

    for (const part of pathParts) {
      if (!current) return null;
      current = current[part];
    }

    return current?.[index];
  };

  const hasItemError = (basePath: string, index: number) => {
    return !!getItemErrors(basePath, index);
  };

  const projectData = form.watch('project');
  const formErrors = form.formState.errors;

  // Tính toán overall status
  const getOverallStatus = () => {
    const hasErrors = Object.keys(formErrors).length > 0;
    const hasWarnings = validationStatuses.some((s) => s.status === 'warning');

    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'valid';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Upload className='h-5 w-5' />
              Import Project
            </CardTitle>
            <CardDescription>
              Upload a JSON file containing your project data. Invalid fields will be highlighted
              for correction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-center w-full'>
              <label
                htmlFor='file-upload'
                className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors'
              >
                <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                  <FileJson className='w-8 h-8 mb-2 text-muted-foreground' />
                  <p className='mb-2 text-sm text-muted-foreground'>
                    <span className='font-semibold'>Click to upload</span> or drag and drop
                  </p>
                  <p className='text-xs text-muted-foreground'>JSON file only</p>
                </div>
                <input
                  id='file-upload'
                  type='file'
                  className='hidden'
                  accept='.json,application/json'
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {parseError && (
              <Alert variant='destructive' className='mt-4'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Parse Error</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Validation Overview */}
        {rawImportData && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>Validation Status</span>
                <ValidationStatusBadge status={getOverallStatus()} />
              </CardTitle>
              <CardDescription>
                {getOverallStatus() === 'valid'
                  ? 'All data is valid and ready to import'
                  : getOverallStatus() === 'warning'
                    ? 'Some items have issues.  You can fix them or remove invalid items.'
                    : 'Please fix the errors below before importing'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                {validationStatuses.map((status) => (
                  <div
                    key={status.field}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md border',
                      status.status === 'valid' &&
                        'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
                      status.status === 'warning' &&
                        'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
                      status.status === 'error' &&
                        'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
                    )}
                  >
                    <span className='text-sm font-medium capitalize'>{status.field}</span>
                    <div className='flex items-center gap-1'>
                      {status.count && (
                        <span className='text-xs text-muted-foreground'>
                          {status.count.valid}/{status.count.valid + status.count.invalid}
                        </span>
                      )}
                      {status.status === 'valid' && (
                        <CheckCircle2 className='w-4 h-4 text-green-500' />
                      )}
                      {status.status === 'warning' && (
                        <AlertTriangle className='w-4 h-4 text-yellow-500' />
                      )}
                      {status.status === 'error' && <XCircle className='w-4 h-4 text-red-500' />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Details Section */}
        {rawImportData && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Review and edit the project information</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='project.id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl>
                          <Input placeholder='project-id' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='project.key'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Key</FormLabel>
                        <FormControl>
                          <Input placeholder='PRJ' {...field} />
                        </FormControl>
                        <FormDescription>Unique identifier (max 10 chars)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='project.name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder='My Project' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='project.description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Project description...'
                          className='resize-none'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='project.leadId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Lead ID</FormLabel>
                      <FormControl>
                        <Input placeholder='user-id' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Editable Data Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>
                  Review, edit, or remove items with validation errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion
                  type='multiple'
                  value={expandedSections}
                  onValueChange={setExpandedSections}
                  className='w-full'
                >
                  {/* Roles */}
                  <AccordionItem value='roles'>
                    <AccordionTrigger>
                      <div className='flex items-center gap-2'>
                        <span>Roles</span>
                        <Badge variant='secondary'>{roleFields.length}</Badge>
                        {validationStatuses.find((s) => s.field === 'roles')?.status !==
                          'valid' && <AlertTriangle className='w-4 h-4 text-yellow-500' />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {roleFields.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Permissions</TableHead>
                              <TableHead className='w-[50px]'></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {roleFields.map((field, index) => (
                              <TableRow
                                key={field.id}
                                className={cn(
                                  hasItemError('project.roles', index) &&
                                    'bg-red-50 dark:bg-red-950',
                                )}
                              >
                                <TableCell>
                                  {hasItemError('project.roles', index) ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <XCircle className='w-4 h-4 text-red-500' />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>This item has validation errors</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <CheckCircle2 className='w-4 h-4 text-green-500' />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.roles.${index}.id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.roles?.[index]?.id &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.roles.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.roles?.[index]?.name &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge variant='outline'>
                                    {projectData.roles?.[index]?.permissions?.length || 0}{' '}
                                    permissions
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => removeRole(index)}
                                  >
                                    <Trash2 className='w-4 h-4 text-muted-foreground hover:text-red-500' />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className='text-sm text-muted-foreground py-4 text-center'>
                          No roles to import
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Issue Types */}
                  <AccordionItem value='types'>
                    <AccordionTrigger>
                      <div className='flex items-center gap-2'>
                        <span>Issue Types</span>
                        <Badge variant='secondary'>{typeFields.length}</Badge>
                        {validationStatuses.find((s) => s.field === 'types')?.status !==
                          'valid' && <AlertTriangle className='w-4 h-4 text-yellow-500' />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {typeFields.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead className='w-[50px]'></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {typeFields.map((field, index) => (
                              <TableRow
                                key={field.id}
                                className={cn(
                                  hasItemError('project.types', index) &&
                                    'bg-red-50 dark:bg-red-950',
                                )}
                              >
                                <TableCell>
                                  {hasItemError('project.types', index) ? (
                                    <XCircle className='w-4 h-4 text-red-500' />
                                  ) : (
                                    <CheckCircle2 className='w-4 h-4 text-green-500' />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.types.${index}.id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.types?.[index]?.id &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.types.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.types?.[index]?.name &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.types.${index}.color`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value || null)}
                                            placeholder='#000000'
                                            className='h-8'
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => removeType(index)}
                                  >
                                    <Trash2 className='w-4 h-4 text-muted-foreground hover:text-red-500' />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className='text-sm text-muted-foreground py-4 text-center'>
                          No issue types to import
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Priorities */}
                  <AccordionItem value='priorities'>
                    <AccordionTrigger>
                      <div className='flex items-center gap-2'>
                        <span>Priorities</span>
                        <Badge variant='secondary'>{priorityFields.length}</Badge>
                        {validationStatuses.find((s) => s.field === 'priorities')?.status !==
                          'valid' && <AlertTriangle className='w-4 h-4 text-yellow-500' />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {priorityFields.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Order</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead className='w-[50px]'></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {priorityFields.map((field, index) => (
                              <TableRow
                                key={field.id}
                                className={cn(
                                  hasItemError('project.priorities', index) &&
                                    'bg-red-50 dark:bg-red-950',
                                )}
                              >
                                <TableCell>
                                  {hasItemError('project.priorities', index) ? (
                                    <XCircle className='w-4 h-4 text-red-500' />
                                  ) : (
                                    <CheckCircle2 className='w-4 h-4 text-green-500' />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.priorities.${index}.id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.priorities?.[index]?.id &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.priorities.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.priorities?.[index]?.name &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.priorities.${index}.order`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            type='number'
                                            onChange={(e) =>
                                              field.onChange(parseInt(e.target.value) || 0)
                                            }
                                            className='h-8 w-20'
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.priorities.${index}.color`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value || null)}
                                            placeholder='#000000'
                                            className='h-8'
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => removePriority(index)}
                                  >
                                    <Trash2 className='w-4 h-4 text-muted-foreground hover:text-red-500' />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className='text-sm text-muted-foreground py-4 text-center'>
                          No priorities to import
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Statuses */}
                  <AccordionItem value='statuses'>
                    <AccordionTrigger>
                      <div className='flex items-center gap-2'>
                        <span>Statuses</span>
                        <Badge variant='secondary'>{statusFields.length}</Badge>
                        {validationStatuses.find((s) => s.field === 'statuses')?.status !==
                          'valid' && <AlertTriangle className='w-4 h-4 text-yellow-500' />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {statusFields.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Order</TableHead>
                              <TableHead className='w-[50px]'></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statusFields.map((field, index) => (
                              <TableRow
                                key={field.id}
                                className={cn(
                                  hasItemError('project.statuses', index) &&
                                    'bg-red-50 dark:bg-red-950',
                                )}
                              >
                                <TableCell>
                                  {hasItemError('project.statuses', index) ? (
                                    <XCircle className='w-4 h-4 text-red-500' />
                                  ) : (
                                    <CheckCircle2 className='w-4 h-4 text-green-500' />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.statuses.${index}.id`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.statuses?.[index]?.id &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.statuses.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.statuses?.[index]?.name &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.statuses.${index}.category`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <select
                                            {...field}
                                            className='h-8 px-2 rounded-md border bg-background text-sm'
                                          >
                                            <option value='TODO'>TODO</option>
                                            <option value='IN_PROGRESS'>IN_PROGRESS</option>
                                            <option value='DONE'>DONE</option>
                                          </select>
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.statuses.${index}. order`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            type='number'
                                            onChange={(e) =>
                                              field.onChange(parseInt(e.target.value) || 0)
                                            }
                                            className='h-8 w-20'
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => removeStatus(index)}
                                  >
                                    <Trash2 className='w-4 h-4 text-muted-foreground hover:text-red-500' />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className='text-sm text-muted-foreground py-4 text-center'>
                          No statuses to import
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Issues */}
                  <AccordionItem value='issues'>
                    <AccordionTrigger>
                      <div className='flex items-center gap-2'>
                        <span>Issues</span>
                        <Badge variant='secondary'>{issueFields.length}</Badge>
                        {validationStatuses.find((s) => s.field === 'issues')?.status !==
                          'valid' && <AlertTriangle className='w-4 h-4 text-yellow-500' />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {issueFields.length > 0 ? (
                        <div className='max-h-96 overflow-y-auto'>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Key</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type ID</TableHead>
                                <TableHead>Status ID</TableHead>
                                <TableHead className='w-[50px]'></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {issueFields.map((field, index) => (
                                <TableRow
                                  key={field.id}
                                  className={cn(
                                    hasItemError('project.issues', index) &&
                                      'bg-red-50 dark:bg-red-950',
                                  )}
                                >
                                  <TableCell>
                                    {hasItemError('project.issues', index) ? (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <XCircle className='w-4 h-4 text-red-500' />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>This issue has validation errors</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : (
                                      <CheckCircle2 className='w-4 h-4 text-green-500' />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`project.issues.${index}.key`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              className={cn(
                                                'h-8 w-24',
                                                formErrors.project?.issues?.[index]?.key &&
                                                  'border-red-500',
                                              )}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`project.issues.${index}.title`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              className={cn(
                                                'h-8',
                                                formErrors.project?.issues?.[index]?.title &&
                                                  'border-red-500',
                                              )}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`project.issues.${index}.typeId`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              className={cn(
                                                'h-8 w-28',
                                                formErrors.project?.issues?.[index]?.typeId &&
                                                  'border-red-500',
                                              )}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`project.issues.${index}.statusId`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              className={cn(
                                                'h-8 w-28',
                                                formErrors.project?.issues?.[index]?.statusId &&
                                                  'border-red-500',
                                              )}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      onClick={() => removeIssue(index)}
                                    >
                                      <Trash2 className='w-4 h-4 text-muted-foreground hover:text-red-500' />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className='text-sm text-muted-foreground py-4 text-center'>
                          No issues to import
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Team Members */}
                  <AccordionItem value='actors'>
                    <AccordionTrigger>
                      <div className='flex items-center gap-2'>
                        <span>Team Members</span>
                        <Badge variant='secondary'>{actorFields.length}</Badge>
                        {validationStatuses.find((s) => s.field === 'actors')?.status !==
                          'valid' && <AlertTriangle className='w-4 h-4 text-yellow-500' />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {actorFields.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>Actor ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Role ID</TableHead>
                              <TableHead className='w-[50px]'></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {actorFields.map((field, index) => (
                              <TableRow
                                key={field.id}
                                className={cn(
                                  hasItemError('project.actors', index) &&
                                    'bg-red-50 dark:bg-red-950',
                                )}
                              >
                                <TableCell>
                                  {hasItemError('project.actors', index) ? (
                                    <XCircle className='w-4 h-4 text-red-500' />
                                  ) : (
                                    <CheckCircle2 className='w-4 h-4 text-green-500' />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.actors.${index}.actorId`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.actors?.[index]?.actorId &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge variant='outline'>USER</Badge>
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`project.actors.${index}.roleId`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            className={cn(
                                              'h-8',
                                              formErrors.project?.actors?.[index]?.roleId &&
                                                'border-red-500',
                                            )}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => removeActor(index)}
                                  >
                                    <Trash2 className='w-4 h-4 text-muted-foreground hover:text-red-500' />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className='text-sm text-muted-foreground py-4 text-center'>
                          No team members to import
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className='flex justify-between items-center'>
              <div className='text-sm text-muted-foreground'>
                {getOverallStatus() === 'warning' && (
                  <span className='flex items-center gap-1'>
                    <AlertTriangle className='w-4 h-4 text-yellow-500' />
                    Some items have warnings but you can still import
                  </span>
                )}
              </div>
              <div className='flex gap-4'>
                {onCancel && (
                  <Button type='button' variant='outline' onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type='submit' disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting ? 'Importing...' : 'Import Project'}
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
