import React from 'react';
import { Tabs, TabsContent, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusIcon, XIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import isEqual from 'lodash/isEqual';
import { ProjectImport } from '@/contracts/projects';
import { useAtom } from 'jotai';
import { estimationTabsAtom } from '@/features/projects/state/project-import-atom';
import { EstimationReport } from './estimation-report/estimation-report-v2';
import { insightAI } from '@/lib/insight-ai';
import { projectToTextReport } from '@/features/projects/utils/project-to-text-report';

type EstimationReportType = any;
type Estimation = {
  input?: Partial<ProjectImport>;
  output?: EstimationReportType;
};

type EstimationTabDetailProps = {
  tabId: string;
  tabName?: string;
  estimation?: Estimation;
  onEstimationChange?: (estimation: Estimation) => void;
};

const EstimationTabDetail = ({ estimation, onEstimationChange }: EstimationTabDetailProps) => {
  const form = useFormContext<ProjectImport>();
  const [isEstimating, setIsEstimating] = React.useState(false);

  const project = form.watch();

  const handleUseThis = () => {
    if (!estimation?.input) return;
    form.reset(estimation.input);
  };

  const isDifferentFromForm = React.useMemo(() => {
    if (!estimation?.input) return false;
    return !isEqual(estimation.input, project);
  }, [estimation, project]);

  const handleEstimate = async () => {
    try {
      setIsEstimating(true);
      const clonedProject = JSON.parse(JSON.stringify(project));

      onEstimationChange?.({ input: clonedProject });

      const report = projectToTextReport(clonedProject, []);
      const file = new File([report], 'estimation.txt', { type: 'text/plain' });
      const estimationResult = await insightAI.fileEstimate(file);

      onEstimationChange?.({ input: clonedProject, output: estimationResult });
    } catch (error) {
      console.error('Estimation failed:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  if (!estimation || !estimation.output) {
    return (
      <div className='p-4'>
        <h2 className='text-lg font-semibold'>Estimation Details</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {estimation?.input
            ? 'Estimation in progress...'
            : 'Content for the estimation tab goes here.'}
        </p>
        <Button type='button' className='mt-4' onClick={handleEstimate} disabled={isEstimating}>
          {isEstimating ? 'Estimating...' : 'Estimate Project'}
        </Button>
      </div>
    );
  }

  return (
    <div className='size-full flex flex-col gap-2'>
      <div className='flex items-center justify-end sticky top-0 z-10 bg-background p-2 gap-2 border-b border-border'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={handleUseThis}
          disabled={!isDifferentFromForm}
        >
          Retrieve This Input (Project)
        </Button>
        <Button type='button' size='sm' onClick={handleEstimate} disabled={isEstimating}>
          {isEstimating ? 'Estimating...' : 'Re-Estimate'}
        </Button>
      </div>
      <EstimationReport data={estimation.output} />
    </div>
  );
};

export default function EstimationsTab() {
  const [activeTab, setActiveTab] = React.useState('tab-0');
  const [tabs, setTabs] = useAtom(estimationTabsAtom);

  const addNewTab = React.useCallback(() => {
    const index = tabs.length;
    const newTabId = `tab-${Date.now()}`;

    const newTab: EstimationTabDetailProps = {
      tabId: newTabId,
      tabName: `Estimation ${index + 1}`,
      // Không set onEstimationChange ở đây - sẽ được inject từ parent
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTabId);
  }, [tabs]);

  const closeTab = React.useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();

      const tabIndex = tabs.findIndex((t) => t.tabId === tabId);
      const newTabs = tabs.filter((t) => t.tabId !== tabId);

      setTabs(newTabs);

      // Nếu tab đang đóng là tab active, chuyển sang tab khác
      if (activeTab === tabId && newTabs.length > 0) {
        const newActiveTab = newTabs[Math.min(tabIndex, newTabs.length - 1)].tabId;
        setActiveTab(newActiveTab);
      }
    },
    [tabs, activeTab],
  );

  if (tabs.length === 0) {
    return (
      <div className='p-4'>
        <h2 className='text-lg font-semibold'>No Estimation Tabs</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Click the button below to add a new estimation tab.
        </p>
        <Button type='button' className='mt-4' onClick={addNewTab}>
          Add Estimation Tab
        </Button>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className='size-full bg-blue'>
      <TabsList className='w-full h-auto'>
        <ScrollArea className='size-full'>
          <div className='flex flex-row justify-start p-1 box-content border-b border-border'>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.tabId}
                value={tab.tabId}
                data-tab-id={tab.tabId}
                className={cn(
                  'min-w-12 max-w-32',
                  'group relative flex shrink-0 cursor-pointer items-center gap-2 border-r px-2',
                  'rounded-sm bg-transparent overflow-hidden',
                  'transition-colors duration-150',
                  'hover:bg-muted/50',
                  'data-[state=active]:bg-background',
                  'data-[state=active]:shadow-sm',
                )}
              >
                <span className='max-w-[120px] truncate text-sm font-medium'>
                  {tab.tabName || `Estimation ${tabs.indexOf(tab) + 1}`}
                </span>

                {tabs.length > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className={cn(
                      'h-5 w-5 shrink-0 rounded-sm p-0',
                      'opacity-0 transition-opacity group-hover:opacity-100',
                      'hover:bg-destructive/10 hover:text-destructive',
                    )}
                    onClick={(e) => closeTab(e, tab.tabId)}
                  >
                    <XIcon className='h-3 w-3' />
                  </Button>
                )}

                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5 bg-primary',
                    'scale-x-0 transition-transform duration-150',
                    activeTab === tab.tabId && 'scale-x-100',
                  )}
                />
              </TabsTrigger>
            ))}
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-8 w-8 rounded-md hover:bg-muted'
              onClick={addNewTab}
            >
              <PlusIcon className='h-4 w-4' />
            </Button>
          </div>

          <ScrollBar orientation='horizontal' className='h-2' />
        </ScrollArea>
      </TabsList>

      <div className='flex-1 overflow-auto'>
        {tabs.map((tab) => (
          <TabsContent
            key={tab.tabId}
            value={tab.tabId}
            className='m-0 h-full data-[state=inactive]:hidden'
          >
            <EstimationTabDetail
              {...tab}
              onEstimationChange={(estimation) => {
                const newTabs = tabs.map((t) => (t.tabId === tab.tabId ? { ...t, estimation } : t));
                setTabs(newTabs);
              }}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
