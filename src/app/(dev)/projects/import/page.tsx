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
import { projectAtom } from '@/features/projects/state/project-import-atom';
import { ContextOption } from './_components/contexts-bar';
import { useSearchParams } from 'next/navigation';
import { projectDraftByIdAtomFamily } from '@/features/projects/state/project-draft-atom';

const ZGenerateOutput = ZJsonPatchOp.array();

export default function Page() {
  const searchParams = useSearchParams();
  if (!searchParams) throw new Error('Search params not found');

  const draftId = String(searchParams.get('d') ?? '');
  const draft = useAtomValue(projectDraftByIdAtomFamily(draftId));

  const [project] = useAtom<ProjectImport>(projectAtom);

  const form = useForm<ProjectImport>({
    resolver: zodResolver(ZProjectImport) as Resolver<ProjectImport>,
    defaultValues: draft ? draft : project,
    mode: 'onChange',
  });

  const [snapshot, setSnapshot] = React.useState<ProjectImport>();

  const {
    submit,
    object: aiGenerated,
    isLoading,
  } = useObject({
    api: '/api/ai/project/generate',
    schema: ZGenerateOutput,

    onError: (error) => {
      console.error('AI generation error:', error);
      setSnapshot(undefined);
    },

    onFinish: () => {
      setSnapshot(undefined);
    },
  });

  const onSend = async (instruction: string, contexts?: ContextOption[]) => {
    const values = form.getValues();
    setSnapshot(structuredClone(values));
    submit({ values, instruction, contexts });
  };

  useEffect(() => {
    if (!aiGenerated) return;
    if (!snapshot) return;
    try {
      const patchs = ZGenerateOutput.parse(aiGenerated);
      const clonedSnapshot = structuredClone(snapshot);
      const { newDocument: newDoc } = applyPatch(clonedSnapshot, patchs);
      const validDoc = ZProjectDraft.parse(newDoc);
      form.reset(validDoc);
    } catch (error) {
      console.error('Error applying AI-generated updates:', error);
    }
  }, [aiGenerated, snapshot, form]);

  //
  useEffect(() => {
    const callback = form.subscribe({
      name: 'key',
      formState: { values: true, isValid: true },
      callback: ({ values, isValid }) => {
        const keyIsValid = values.key && isValid;
        if (!keyIsValid) return;
        const issues = values.issues;
        const next = issues.map((is, idx) => ({
          ...is,
          id: `${values.key}-${idx + 1}`,
          key: `${values.key}-${idx + 1}`,
        }));
        form.setValue('issues', next);
      },
    });

    return () => callback();
  }, [form]);

  const handleSubmit = form.handleSubmit((data) => {
    console.log('Submitted data:', data);
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
