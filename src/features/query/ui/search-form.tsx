import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { queryApi } from '@/features/query/http';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Bug, ExternalLink, FileText, Folder, Loader2, Search, Target, X } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { useDebounceValue, useIntersectionObserver } from 'usehooks-ts';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'project':
      return <Folder className='size-4 text-blue-500' />;
    case 'board':
      return <Target className='size-4 text-green-500' />;
    case 'sprint':
      return <Target className='size-4 text-purple-500' />;
    case 'issue':
      return <Bug className='size-4 text-red-500' />;
    default:
      return <FileText className='size-4 text-gray-500' />;
  }
};

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'project':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'board':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'sprint':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'issue':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

interface SearchResultItemProps {
  item: any;
  type: string;
  href?: string;
  workspaceId: string;
}

const SearchResultItem = ({ item, type, href, workspaceId }: SearchResultItemProps) => {
  const label = item?.title || item?.name || item?.summary || 'Untitled';
  const iconURL = item?.iconURL || item?.avatar || null;
  const withWs = `/wps/${workspaceId}${href}`;

  return (
    <Card className='p-0 group hover:bg-muted/50 hover:shadow-md transition-all duration-200 border-transparent hover:border-gray-200'>
      <CardContent className='p-2'>
        <div className='flex items-center gap-3'>
          <div className='shrink-0'>
            {iconURL ? (
              <Image
                src={iconURL}
                alt='icon'
                width={24}
                height={24}
                className='size-6 rounded-md object-cover'
              />
            ) : (
              <div className='flex size-6 items-center justify-center rounded-md bg-muted'>
                {getTypeIcon(type)}
              </div>
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between gap-2'>
              <h3 className='font-medium text-sm text-foreground truncate leading-none'>
                {withWs ? (
                  <a
                    href={withWs}
                    className='hover:text-primary transition-colors flex items-center gap-1.5'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <span className='truncate'>{label}</span>
                    <ExternalLink className='size-3 opacity-0 group-hover:opacity-50 transition-opacity' />
                  </a>
                ) : (
                  <span className='truncate'>{label}</span>
                )}
              </h3>
              <Badge
                variant='outline'
                className={`${getTypeBadgeColor(type)} text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 shrink-0 border-0`}
              >
                {type}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SearchSkeleton = () => (
  <div className='space-y-2'>
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} className='p-0 border-transparent shadow-none bg-muted/20'>
        <CardContent className='p-2 flex items-center gap-3'>
          <Skeleton className='size-6 rounded-md' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-4 w-3/4' />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const SearchForm = () => {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Workspace ID not found');

  const [inputValue, setInputValue] = useDebounceValue('', 300);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const { isIntersecting, ref: observerRef } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Sync ref
  useEffect(() => {
    observerRef(loadingRef.current);
  }, [observerRef]);

  const qTrimmed = inputValue.trim();

  const search = useInfiniteQuery({
    queryKey: ['search', qTrimmed],
    initialPageParam: { cursor: undefined, size: 20 } as { cursor?: string; size: number },
    queryFn: async () => {
      const res = await queryApi.searchV2({
        q: qTrimmed,
        workspaceId: params.workspaceId,
      });
      return { results: res, total: res.meta.total };
    },
    getNextPageParam: (lastPage) => {
      const cursor = lastPage.results.meta.cursor;
      return cursor ? { cursor, size: 20 } : undefined;
    },
    staleTime: 60 * 1000,
    enabled: qTrimmed.length > 0,
  });

  useEffect(() => {
    if (isIntersecting && search.hasNextPage && !search.isFetchingNextPage && !search.isLoading) {
      search.fetchNextPage();
    }
  }, [isIntersecting, search.hasNextPage, search.isFetchingNextPage, search.isLoading, search]);

  const results = search.data?.pages.flatMap((page) => page.results.hits) || [];
  const totalResults = search.data?.pages[0]?.total || 0;
  const isSearching = search.isLoading && qTrimmed.length > 0;
  const showResults = results.length > 0;
  const showEmpty = !isSearching && qTrimmed.length > 0 && results.length === 0;

  return (
    <div className='flex flex-col h-full gap-4'>
      <div className='space-y-4 shrink-0'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4' />
          <Input
            id='search-input'
            placeholder='Search...'
            defaultValue={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className='pl-10 pr-10 h-10 text-sm bg-background/50'
          />
          {inputValue && (
            <Button
              variant='ghost'
              size='icon'
              className='absolute right-1 top-1/2 transform -translate-y-1/2 size-8 hover:bg-transparent text-muted-foreground hover:text-foreground'
              onClick={() => {
                setInputValue('');
                const input = document.getElementById('search-input') as HTMLInputElement;
                if (input) input.value = '';
              }}
            >
              <X className='size-4' />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className='flex-1 -mx-4 px-4'>
        {isSearching && results.length === 0 && <SearchSkeleton />}

        {showEmpty && (
          <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground'>
            <div className='bg-muted/50 p-3 rounded-full mb-3'>
              <Search className='size-6' />
            </div>
            <p className='text-sm font-medium'>No results found</p>
            <p className='text-xs text-muted-foreground/80'>
              We couldn&apos;t find anything for &quot;{qTrimmed}&quot;
            </p>
          </div>
        )}

        {showResults && (
          <div className='space-y-4 pb-4'>
            <div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
              <span>
                Found <strong>{totalResults.toLocaleString()}</strong> results
              </span>
            </div>

            <div className='space-y-2'>
              {results.map(({ source: item, type, href }) => (
                <SearchResultItem
                  key={item?.id || 'unknown'}
                  item={item}
                  type={type}
                  href={href}
                  workspaceId={params.workspaceId}
                />
              ))}
            </div>

            {search.hasNextPage && (
              <div ref={loadingRef} className='flex justify-center py-4'>
                {search.isFetchingNextPage && (
                  <Loader2 className='animate-spin size-4 text-muted-foreground' />
                )}
              </div>
            )}
          </div>
        )}

        {!qTrimmed && (
          <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground opacity-50'>
            <Search className='size-12 mb-2 stroke-1' />
            <p className='text-sm'>Type to start searching</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
