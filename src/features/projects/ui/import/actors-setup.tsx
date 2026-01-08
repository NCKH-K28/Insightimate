import React, { useMemo, useCallback } from 'react';
import { useFormContext, useWatch, useFieldArray } from 'react-hook-form';
import { Plus, Users, User, X, Users2 } from 'lucide-react';

import { ProjectImport } from '@/contracts/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import axiosInstance from '@/lib/api/_client';
import { useQuery } from '@tanstack/react-query';

// Types
type ActorType = 'USER' | 'TEAM';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface Actor {
  id: string;
  actorType: ActorType;
  actorId: string;
  roleId: string;
  actor?: {
    name: string;
    avatarURL?: string;
    email?: string;
    members?: { userId: string; user: { name: string; avatarURL?: string; email?: string } }[];
  };
}

type WsActorType = {
  actorType: ActorType;
  actorId: string;
  actor: {
    name: string;
    avatarURL?: string;
    email?: string;
    members?: { userId: string; user: { name: string; avatarURL?: string; email?: string } }[];
  };
};

const loadActorOptions = async (p: { workspaceId: string }) => {
  const res = await axiosInstance.get(`/v2/workspaces/${p.workspaceId}/actors`);
  return res.data as WsActorType[];
};

interface EmptyStateProps {
  onAdd: () => void;
  disabled: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAdd, disabled }) => (
  <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center'>
    <Users className='mb-2 h-8 w-8 text-muted-foreground/50' />
    <p className='text-sm text-muted-foreground'>No actors added yet</p>
    <Button
      type='button'
      variant='link'
      size='sm'
      className='mt-1'
      onClick={onAdd}
      disabled={disabled}
    >
      Add your first actor
    </Button>
  </div>
);

const toKey = (t?: ActorType, id?: string) => (t && id ? `${t}:${id}` : '');

const actorLabel = (opt: WsActorType) => {
  const base = opt.actor?.name ?? 'Unknown';
  if (opt.actorType === 'USER') {
    const email = opt.actor?.email ? ` • ${opt.actor.email}` : '';
    return `${base}${email}`;
  }
  const membersCount = opt.actor?.members?.length ?? 0;
  return `${base} • ${membersCount} member${membersCount === 1 ? '' : 's'}`;
};

// Main component
const ActorsSetup: React.FC = () => {
  const params = useParams<{ workspaceId: string }>();
  if (!params || !params.workspaceId) throw new Error('Workspace ID is required');

  const { control, setValue } = useFormContext<ProjectImport>();

  const roles = useWatch({ control, name: 'roles' }) as Role[] | undefined;
  const actors = useWatch({ control, name: 'actors' }) as Actor[] | undefined;

  const { fields, append, remove } = useFieldArray({ control, name: 'actors' });

  const defaultRoleId = roles?.[0]?.id ?? '';
  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['actorOptions', params.workspaceId],
    queryFn: () => loadActorOptions({ workspaceId: params.workspaceId }),
    enabled: !!params.workspaceId,
  });

  const options = Array.isArray(data) ? data : [];
  const loading = isLoading || isFetching;
  const loadError = error ? ((error as any)?.message ?? 'Failed to load actors') : null;

  const selectedKeys = useMemo(() => {
    const list = (actors ?? []).map((a) => toKey(a.actorType, a.actorId)).filter(Boolean);
    return new Set(list);
  }, [actors]);

  const canAdd = !loading && (roles?.length ?? 0) > 0;

  const addEmptyRow = useCallback(() => {
    append({ actorType: 'USER', actorId: '', roleId: defaultRoleId });
  }, [append, defaultRoleId]);

  const setActorAt = useCallback(
    (index: number, opt?: WsActorType) => {
      const basePath = `actors.${index}` as const;
      const type: ActorType = opt?.actorType ?? 'USER';
      setValue(`${basePath}.actorType`, type, { shouldDirty: true });
      setValue(`${basePath}.actorId`, opt?.actorId ?? '', { shouldDirty: true });

      const currentRoleId = (actors?.[index]?.roleId ?? '') as string;
      if (!currentRoleId && defaultRoleId) {
        setValue(`${basePath}.roleId`, defaultRoleId, { shouldDirty: true });
      }
    },
    [setValue, actors, defaultRoleId],
  );

  const setRoleAt = useCallback(
    (index: number, roleId: string) => {
      setValue(`actors.${index}.roleId`, roleId, { shouldDirty: true });
    },
    [setValue],
  );

  return (
    <Card className='shadow-sm py-2'>
      <CardHeader className='flex flex-row items-center justify-between p-2'>
        <div className='flex items-center gap-2'>
          <Users className='h-5 w-5 text-muted-foreground' />
          <CardTitle className='text-lg'>Actors</CardTitle>
          <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
            {fields.length}
          </span>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className='p-2'>
        {loadError ? (
          <div className='rounded-md border p-3 text-sm text-muted-foreground'>{loadError}</div>
        ) : null}

        {fields.length === 0 ? (
          <EmptyState onAdd={addEmptyRow} disabled={!canAdd} />
        ) : (
          <div className='space-y-2'>
            {fields.map((f, index) => {
              const a = actors?.[index];
              const currentKey = toKey(a?.actorType, a?.actorId);

              const currentOpt =
                options.find((o) => toKey(o.actorType, o.actorId) === currentKey) ?? undefined;

              const roleId = a?.roleId ?? defaultRoleId;

              return (
                <div
                  key={f.id}
                  className='flex flex-col gap-2 rounded-lg border p-2 md:flex-row md:items-center'
                >
                  {/* Actor select */}
                  <div className='flex-1'>
                    <Select
                      value={currentKey || undefined}
                      onValueChange={(val) => {
                        const opt = options.find((o) => toKey(o.actorType, o.actorId) === val);
                        setActorAt(index, opt);
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={loading ? 'Loading actors…' : 'Select actor'} />
                      </SelectTrigger>

                      <SelectContent>
                        {options.map((opt) => {
                          const key = toKey(opt.actorType, opt.actorId);
                          const isTaken = selectedKeys.has(key) && key !== currentKey;

                          return (
                            <SelectItem key={key} value={key} disabled={isTaken}>
                              <span className='flex items-center gap-2'>
                                {opt.actorType === 'USER' ? (
                                  <User className='h-4 w-4 text-muted-foreground' />
                                ) : (
                                  <Users2 className='h-4 w-4 text-muted-foreground' />
                                )}
                                <span className='truncate'>{actorLabel(opt)}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Small hint line */}
                    {currentOpt?.actorType === 'TEAM' && currentOpt.actor?.members?.length ? (
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Team members: {currentOpt.actor.members.length}
                      </p>
                    ) : null}
                  </div>

                  {/* Role select */}
                  <div className='md:w-[220px]'>
                    <Select
                      value={roleId || undefined}
                      onValueChange={(val) => setRoleAt(index, val)}
                      disabled={(roles?.length ?? 0) === 0}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles ?? []).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remove */}
                  <div className='flex justify-end md:justify-start'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => remove(index)}
                      aria-label='Remove actor'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className='pt-1'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='w-full gap-2'
                onClick={addEmptyRow}
                disabled={!canAdd}
              >
                <Plus className='h-4 w-4' />
                Add another actor
              </Button>
              {(!roles || roles.length === 0) && (
                <p className='mt-2 text-xs text-muted-foreground'>
                  Add at least one role before assigning actors.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActorsSetup;
