'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ProjectInfoPanel from './panel-project-infor';

export default function Page() {
  const form = useForm({
    resolver: zodResolver(z.any()),
    defaultValues: {},
  });

  const handleSubmit = form.handleSubmit((data) => {});

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='size-full grid grid-rows-[1fr_auto] overflow-hidden'>
        {/* Main Content Area */}
        <div className='container mx-auto relative'>
          <div className='absolute inset-0 size-full overflow-hidden'>
            <ResizablePanelGroup direction='horizontal' className='size-full gap-4'>
              <ResizablePanel defaultSize={50} minSize={30} className='p-2'>
                <ProjectInfoPanel />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30} className='p-2'></ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>

        <Separator />

        <div className='container mx-auto px-4 py-4 max-w-4xl w-full'></div>
      </form>
    </Form>
  );
}
