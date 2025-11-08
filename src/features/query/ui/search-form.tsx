import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { queryApi } from '@/features/query/http';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Search, FileText, Folder, Target, Bug, ExternalLink } from 'lucide-react';
import debounce from 'lodash/debounce';
import React from 'react';
import get from 'lodash/get';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'project':
      return <Folder className='w-4 h-4 text-blue-500' />;
    case 'board':
      return <Target className='w-4 h-4 text-green-500' />;
    case 'sprint':
      return <Target className='w-4 h-4 text-purple-500' />;
    case 'issue':
      return <Bug className='w-4 h-4 text-red-500' />;
    default:
      return <FileText className='w-4 h-4 text-gray-500' />;
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

type SearchFormProps = { onSelect?: (item: any) => void };
export const SearchForm = (props: SearchFormProps) => {
  const [q, setQ] = React.useState('');
  const [inputValue, setInputValue] = React.useState('');

  const loadingRef = React.useRef<HTMLDivElement | null>(null);

  const debouncedQ = React.useMemo(() => debounce((value: string) => setQ(value), 300), []);

  React.useEffect(() => {
    debouncedQ(inputValue);
    return () => debouncedQ.cancel();
  }, [inputValue, debouncedQ]);

  const qTrimmed = q.trim();

  const search = useInfiniteQuery({
    queryKey: ['search', qTrimmed],
    initialPageParam: { cursor: undefined, size: 20 } as { cursor?: string; size: number },
    queryFn: async ({ pageParam }) => {
      const { cursor, size } = pageParam;
      const res = await queryApi.searchV2({ q: qTrimmed, pagination: { cursor, size } });
      return { results: res, total: res.meta.total };
    },
    getNextPageParam: (lastPage) => {
      const cursor = lastPage.results.meta.cursor;
      return cursor ? { cursor, size: 20 } : undefined;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Intersection Observer for infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          search.hasNextPage &&
          !search.isFetchingNextPage &&
          !search.isLoading
        ) {
          search.fetchNextPage();
        }
      },
      { rootMargin: '50px' },
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [search.hasNextPage, search.isFetchingNextPage, search.isLoading, search.fetchNextPage]);

  const results = search.data?.pages.flatMap((page) => page.results.hits) || [];
  const totalResults = search.data?.pages[0]?.total || 0;

  return (
    <div className='size-full grid grid-rows-[auto_1fr] gap-4'>
      {/* Search Input Section */}
      <div className='space-y-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            id='search-input'
            placeholder='Search projects, boards, sprints, and issues...'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className='pl-10 pr-4 h-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
          {search.isLoading && (
            <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin w-4 h-4 text-gray-400' />
          )}
        </div>

        {/* Facets Placeholder */}
        <div className='text-sm text-gray-500 italic'>Facets go here</div>
      </div>

      {/* Results Section */}
      <div
        className='max-h-96 overflow-y-auto'
        hidden={qTrimmed.length === 0 && results.length === 0}
      >
        {/* Results Header */}
        {qTrimmed.length > 0 && (
          <div className='mb-3 pb-2 border-b border-gray-200'>
            <p className='text-sm text-gray-600'>
              {search.isLoading && results.length === 0 ? (
                'Searching...'
              ) : (
                <>
                  {totalResults > 0 ? (
                    <>
                      <span className='font-medium'>{totalResults.toLocaleString()}</span> results
                      {qTrimmed && (
                        <>
                          {' '}
                          for "<span className='font-medium'>{qTrimmed}</span>"
                        </>
                      )}
                    </>
                  ) : (
                    'No results found'
                  )}
                </>
              )}
            </p>
          </div>
        )}

        {/* Results List */}
        <div className='space-y-2'>
          {results.map(({ source: item, type }) => {
            const value = get(item, 'id', 'unknown');
            const label =
              get(item, 'title') || get(item, 'name') || get(item, 'summary') || 'Untitled';
            const iconURL = get(item, 'iconURL') || get(item, 'iconLink') || null;
            const url = get(item, 'url') || get(item, 'link') || null;

            return (
              <Card
                key={value}
                className='hover:shadow-md transition-shadow duration-200 px-1 py-2'
              >
                <CardContent className='px-2 py-1'>
                  <div className='flex items-start gap-3'>
                    {/* Icon */}
                    <div className='mt-0.5 flex-shrink-0'>
                      {iconURL ? (
                        <img src={iconURL} alt='' className='w-5 h-5 rounded object-cover' />
                      ) : (
                        getTypeIcon(type)
                      )}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      {/* Title and Type */}
                      <div className='flex items-start justify-between gap-2'>
                        <h3 className='font-medium text-gray-900 leading-snug'>
                          {url ? (
                            <a
                              href={url}
                              className='hover:text-blue-600 transition-colors duration-150 flex items-center gap-1'
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {label}
                              <ExternalLink className='w-3 h-3 opacity-60' />
                            </a>
                          ) : (
                            label
                          )}
                        </h3>
                        <Badge
                          variant='secondary'
                          className={`${getTypeBadgeColor(type)} text-xs font-medium flex-shrink-0`}
                        >
                          {type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loading and Footer */}
        {search.hasNextPage && (
          <div ref={loadingRef} className='flex justify-center items-center p-4'>
            {search.isFetchingNextPage ? (
              <div className='flex items-center gap-2 text-sm text-gray-500'>
                <Loader2 className='animate-spin w-4 h-4' />
                Loading more results...
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

// {
//   /* Breadcrumbs */
// }
// {
//   item.breadcrumbs && item.breadcrumbs.length > 0 && (
//     <nav className='mb-2'>
//       <ol className='flex items-center space-x-1 text-xs text-gray-500'>
//         {item?.breadcrumbs.map((crumb, index) => (
//           <li key={crumb.id} className='flex items-center'>
//             {index > 0 && <span className='mx-1'>/</span>}
//             {crumb.href ? (
//               <a href={crumb.href} className='hover:text-gray-700 transition-colors duration-150'>
//                 {crumb.label}
//               </a>
//             ) : (
//               <span>{crumb.label}</span>
//             )}
//           </li>
//         ))}
//       </ol>
//     </nav>
//   );
// }

// {
//   /* Snippet */
// }
// {
//   item.snippet && <p className='text-xs text-gray-700'>{item.snippet}</p>;
// }
