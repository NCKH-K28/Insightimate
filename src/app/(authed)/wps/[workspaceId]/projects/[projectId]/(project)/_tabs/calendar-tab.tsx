import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
  Feature,
} from '@/features/boards/hooks/calendar';
import { useQuery } from '@tanstack/react-query';
import { listBoardIssuesQueryOptions } from '@/features/boards/api/actions';
import { useMemo } from 'react';

type CalendarTabProps = { params: { boardId: string; projectId: string; workspaceId: string } };
export function CalendarTab({ params }: CalendarTabProps) {
  const { boardId } = params;
  const { data: boardIssues, isPending } = useQuery({
    ...listBoardIssuesQueryOptions(boardId, { include: ['sprint'] }),
    refetchOnWindowFocus: true,
  });

  // to feature
  const features: Feature[] = useMemo(() => {
    if (!boardIssues) return [];
    return boardIssues
      .map((issue): Feature | null => {
        if (!issue.startDate || !issue.dueDate) return null;
        return {
          id: issue.id,
          name: issue.summary,
          startAt: new Date(issue.startDate),
          endAt: new Date(issue.dueDate),
          status: {
            id: issue.status?.id ?? '',
            name: issue.status?.name ?? 'No Status',
            color: issue.status?.color ?? '#6B7280',
          },
        };
      })
      .filter((feature): feature is Feature => feature !== null);
  }, [boardIssues]);

  const earliestYear = useMemo(() => {
    if (features.length === 0) return new Date().getFullYear();
    return Math.min(...features.map((feature) => feature.startAt.getFullYear()));
  }, [features]);

  const latestYear = useMemo(() => {
    if (features.length === 0) return new Date().getFullYear();
    return Math.max(...features.map((feature) => feature.endAt.getFullYear()));
  }, [features]);

  if (isPending) return <div>Loading...</div>;

  return (
    <div className='size-full overflow-x-auto overflow-y-auto'>
      <CalendarProvider>
        <CalendarDate>
          <CalendarDatePicker>
            <CalendarMonthPicker />
            <CalendarYearPicker end={latestYear} start={earliestYear} />
          </CalendarDatePicker>
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader />
        <CalendarBody features={features}>
          {({ feature }) => <CalendarItem feature={feature} key={feature.id} />}
        </CalendarBody>
      </CalendarProvider>
    </div>
  );
}
