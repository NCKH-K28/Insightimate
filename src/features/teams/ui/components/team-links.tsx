import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useMemo } from 'react';
import { getTeamQueryOptions, listTeamLinksQueryOptions } from '@/features/teams/api/actionts';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TeamLinks = (props: { teamId: string }) => {
  const pathname = usePathname();
  const { data: team } = useSuspenseQuery(getTeamQueryOptions(props.teamId));
  const { data: links } = useQuery(listTeamLinksQueryOptions(props.teamId));

  const basePath = useMemo(() => {
    const reg = /\/wps\/([^/]+)\//;
    const match = pathname.match(reg);
    return match ? match[0] : '/';
  }, [pathname]);

  const linksMapped = links?.map((link) => {
    let href = '#';
    if (link.type === 'project') {
      href = basePath + `projects/${link.subject.value}`;
    } else if (link.type === 'team') {
      href = basePath + `teams/${link.subject.value}`;
    } else if (link.type === 'user') {
      href = basePath + `users/${link.subject.value}`;
    }
    return { ...link, href };
  });

  return (
    <Card className='shadow-none'>
      <CardHeader>
        <CardTitle>Team Links</CardTitle>
        <CardDescription>
          Links associated with the team <span className='font-semibold'>{team?.name}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-4'>
          {linksMapped?.length ? (
            linksMapped.map((link) => (
              <div key={link.id} className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>{link.subject.label}</p>
                  <p className='text-sm text-muted-foreground'>Type: {link.type}</p>
                </div>
                <Button variant='link' asChild>
                  <Link href={link.href} target='_blank' rel='noopener noreferrer'>
                    Go to link
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>No links found for this team.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Wrapper = (Component: typeof TeamLinks) => (props: Parameters<typeof TeamLinks>[0]) => {
  return (
    <Suspense fallback={<div className='h-52 bg-gray-200 rounded animate-pulse' />}>
      <Component {...props} />
    </Suspense>
  );
};

export default Wrapper(TeamLinks);
