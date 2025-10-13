'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.replace(pathname + '/foryou');
  }, [pathname]);

  return null;
}
