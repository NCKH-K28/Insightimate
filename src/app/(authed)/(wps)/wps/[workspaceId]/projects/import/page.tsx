'use client';

import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ProjectInfoPanel from './_components/panel-project-infor';
import { ProjectImport, ZProjectDraft, ZProjectImport } from '@/contracts/projects';
import ProjectPreviewPanel from './_components/panel-project-preview';
import { useAtom, useAtomValue } from 'jotai';
import React, { useEffect } from 'react';
import InstructionInput from './_components/instruction-input';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { ZJsonPatchOp } from '@/lib/jsonpatch';
import { applyPatch } from 'fast-json-patch';
import {
  contextsAtom,
  instructionAtom,
  projectAtom,
} from '@/features/projects/state/project-import-atom';
import { ContextOption } from './_components/contexts-bar';
import { usePathname, useSearchParams } from 'next/navigation';
import { projectDraftByIdAtomFamily } from '@/features/projects/state/project-draft-atom';
import { useParams } from 'next/navigation';
import axiosInstance from '@/lib/api/_client';
import { useRouter } from 'next/navigation';
import { useDebounce, useEffectOnce } from 'react-use';
import { createId } from '@paralleldrive/cuid2';

const ZGenerateOutput = ZJsonPatchOp.array();

export default function Page() {
  const params = useParams<{ workspaceId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  if (!params) throw new Error('Params is required');
  if (!searchParams) throw new Error('Search params is required');
  if (!router) throw new Error('Router is required');

  const draftId = String(searchParams.get('d') ?? '');
  const draft = useAtomValue(projectDraftByIdAtomFamily(draftId));

  const [project] = useAtom<ProjectImport>(projectAtom);
  const [instruction] = useAtom<string>(instructionAtom);
  const [contexts] = useAtom<ContextOption[]>(contextsAtom);

  const form = useForm<ProjectImport>({
    resolver: zodResolver(ZProjectImport) as Resolver<ProjectImport>,
    defaultValues: draft ? draft : project,
    mode: 'onChange',
  });

  const {
    submit,
    object: aiGenerated,
    isLoading,
  } = useObject({
    api: '/api/ai/project/generate',
    schema: ZGenerateOutput,

    onError: (error) => {
      console.error('AI generation error:', error);
    },

    onFinish: () => {},
  });
  const onSend = (instruction: string, contexts?: ContextOption[]) => {
    const values = form.getValues();
    submit({ values, instruction, contexts });
  };

  useDebounce(
    () => {
      if (!aiGenerated) return;
      try {
        const values = form.getValues();
        const snapshot = JSON.parse(JSON.stringify(values));
        const patchs = ZGenerateOutput.parse(aiGenerated);
        const cloned = structuredClone(snapshot);
        const { newDocument } = applyPatch(cloned, patchs);
        const validDoc = ZProjectDraft.parse(newDocument);
        const normalized = {
          ...validDoc,
          issues: (validDoc.issues ?? []).map((is) => ({ ...is, id: is.id ?? createId() })),
        };
        form.reset(normalized as ProjectImport);
      } catch (e) {
        console.error('Error applying AI-generated updates:', e);
      }
    },
    200,
    [aiGenerated],
  );

  useEffectOnce(() => {
    const qA = String(searchParams.get('a') ?? '');
    const qI = String(searchParams.get('i') ?? '');
    if (!qA || qA.length == 0) return;
    if (qA == 'send') onSend(qI ?? instruction, contexts);
    const newSearch = new URLSearchParams(searchParams);
    newSearch.delete('a');
    newSearch.delete('i');
    router.replace(`${pathname}?${newSearch.toString()}`);
  });

  useEffect(() => {
    const callback = form.subscribe({
      name: 'key',
      formState: { values: true, dirtyFields: true },
      callback: ({ values }) => {
        const keyIsValid = values.key;
        if (!keyIsValid) return;
        const issues = values.issues;
        const next = issues.map((is, idx) => ({ ...is, key: `${values.key}-${idx + 1}` }));
        form.setValue('issues', next);
      },
    });

    return () => callback();
  }, [form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const issues = data.issues.map((is) => ({ ...is, id: is.id ? is.id : createId() }));
    const input = { ...data, issues };
    const path = `/v2/workspaces/${params.workspaceId}/projects/import`;
    const res = await axiosInstance.post(path, input);
    router.push(`/wps/${params.workspaceId}/projects/${res.data.id}`);
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className='h-screen w-screen size-full grid grid-rows-[1fr_auto] overflow-hidden'
      >
        {/* Main Content Area */}
        <div className='container mx-auto relative'>
          <div className='absolute inset-0 size-full overflow-hidden'>
            <ResizablePanelGroup direction='horizontal' className='size-full gap-4'>
              <ResizablePanel defaultSize={50} minSize={30} className='p-2'>
                <ProjectInfoPanel />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30} className='p-2 relative'>
                <div className='size-full absolute inset-0 overflow-auto'>
                  <ProjectPreviewPanel />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>

        <Separator />

        <div className='container mx-auto px-4 py-4 max-w-4xl w-full'>
          <InstructionInput onSend={onSend} isLoading={isLoading} />
        </div>
      </form>
    </Form>
  );
}
