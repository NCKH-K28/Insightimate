import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listProjectFieldTypesQueryOptions,
  createProjectWorkTypeMutationOptions,
  deleteProjectWorkTypeMutationOptions,
} from '../../api/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2Icon, PlusIcon } from 'lucide-react';

type WorkType = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sequence?: number;
};

export const WorkTypeSettings = (props: { projectId: string }) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const { data: typesResponse, isLoading } = useQuery(
    listProjectFieldTypesQueryOptions({ projId: props.projectId }),
  );

  const createType = useMutation({
    ...createProjectWorkTypeMutationOptions({ projId: props.projectId }),
    onSuccess: () => {
      toast.success('Work type created successfully');
      setNewTypeName('');
      setNewTypeDesc('');
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create work type');
    },
  });

  const deleteType = useMutation({
    ...deleteProjectWorkTypeMutationOptions({ projId: props.projectId }),
    onSuccess: () => {
      toast.success('Work type deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete work type');
    },
  });

  const types = useMemo(() => {
    if (!typesResponse) return [];
    return (typesResponse as any).items || [];
  }, [typesResponse]);

  const handleCreate = () => {
    if (!newTypeName.trim()) return;
    createType.mutate({ name: newTypeName, description: newTypeDesc });
  };

  const handleDelete = (typeId: string) => {
    if (confirm('Are you certain you want to delete this work type? Associated issues will not be automatically reassigned.')) {
      deleteType.mutate(typeId);
    }
  };

  return (
    <div className='p-6 bg-gray-50 min-h-screen rounded-md'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-gray-800'>Work Types</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage the distinct classifications of items you track in this project (e.g. Bug, Task).
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className='w-4 h-4 mr-2' /> Add Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Work Type</DialogTitle>
                <DialogDescription>
                  Define a new category to separate specific kinds of work.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name</Label>
                  <Input
                    id='name'
                    placeholder='Epics, Bugs, Chores, etc.'
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='desc'>Description</Label>
                  <Input
                    id='desc'
                    placeholder='Optional description'
                    value={newTypeDesc}
                    onChange={(e) => setNewTypeDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newTypeName.trim() || createType.isPending}>
                  {createType.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className='text-muted-foreground text-sm'>Loading types...</div>
        ) : (
          <div className='bg-white border rounded-lg overflow-hidden shadow-sm'>
            {types.length === 0 ? (
              <div className='p-8 text-center text-muted-foreground'>
                No work types configured yet.
              </div>
            ) : (
              <ul className='divide-y'>
                {types.map((type: WorkType) => (
                  <li key={type.id} className='p-4 flex items-center justify-between hover:bg-gray-50 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <div className='w-3 h-3 rounded-sm' style={{ backgroundColor: type.color || '#9ca3af' }} />
                      <div>
                        <span className='font-medium text-gray-900'>{type.name}</span>
                        {type.description && (
                          <p className='text-xs text-muted-foreground mt-0.5'>{type.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive opacity-50 hover:opacity-100 transition-opacity'
                      onClick={() => handleDelete(type.id)}
                      disabled={types.length <= 1 || deleteType.isPending}
                      title={types.length <= 1 ? 'Projects require at least one work type' : 'Delete type'}
                    >
                      <Trash2Icon className='w-4 h-4' />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
