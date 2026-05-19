export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

/**
 * Root page — smart redirect:
 * - No session → /signin
 * - Has session → / (which is handled by (authed) layout's AuthGuard)
 *
 * Note: This page is at app/page.tsx (outside the (authed) group).
 * The middleware already handles auth redirects, so this is just a fallback.
 */
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/signin');
  }

  // User is authenticated — the (authed) layout will handle them.
  // We don't redirect to /signin here to avoid the loop.
  // Instead, let the (authed)/page.tsx + AuthGuard take over.
  redirect('/orgs');
}
