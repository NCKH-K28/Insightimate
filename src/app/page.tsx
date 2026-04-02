export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

const NAVIGATE_TO = '/signin';
export default function Page() {
  redirect(NAVIGATE_TO);

  return null;
}
