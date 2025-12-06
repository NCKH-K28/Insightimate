'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

type BreadcrumbData = {
  label: string;
  href: string;
  iconURL?: string | null;
};

type BreadcrumbIconProps = {
  iconURL?: string | null;
  label: string;
};

const BreadcrumbIcon: React.FC<BreadcrumbIconProps> = ({ iconURL, label }) => {
  if (!iconURL) return null;
  return <Image src={iconURL} alt={label} width={16} height={16} />;
  //   );
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pathname) return;

    const controller = new AbortController();

    const loadBreadcrumbs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/ui/breadcrumbs?path=${encodeURIComponent(pathname)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch breadcrumbs: ${res.status}`);
        }

        // API trả về trực tiếp mảng Breadcrumb[]
        const data: BreadcrumbData[] = await res.json();
        setBreadcrumbs(data);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error(err);
        setError('Không thể tải breadcrumbs');
      } finally {
        setIsLoading(false);
      }
    };

    loadBreadcrumbs();

    return () => controller.abort();
  }, [pathname]);

  if (isLoading) {
    return <div className='h-5 w-32 rounded-md bg-gray-200 animate-pulse' />;
  }

  if (error || breadcrumbs.length === 0) {
    return null;
  }

  const lastIndex = breadcrumbs.length - 1;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === lastIndex;

          return (
            <BreadcrumbItem key={crumb.href ?? index}>
              {isLast ? (
                <BreadcrumbPage className='inline-flex items-center gap-1'>
                  <BreadcrumbIcon iconURL={crumb.iconURL} label={crumb.label} />
                  <Button variant='link' className='p-0 hover:underline' disabled={true}>
                    {crumb.label}
                  </Button>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href} className='inline-flex items-center gap-1'>
                  <BreadcrumbIcon iconURL={crumb.iconURL} label={crumb.label} />
                  <Button
                    variant='link'
                    className='p-0 hover:underline'
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(crumb.href);
                    }}
                  >
                    {crumb.label}
                  </Button>
                </BreadcrumbLink>
              )}

              {!isLast && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AppBreadcrumbs;
