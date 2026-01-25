import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const NAVS: Array<{
  label: string;
  href: `/o/:orgSlug/settings${string}`;
  icon?: React.ReactNode | (() => React.ReactNode);
}> = [
  { label: 'General', href: '/o/:orgSlug/settings' },
  { label: 'Members', href: '/o/:orgSlug/settings/members' },
  { label: 'Billing', href: '/o/:orgSlug/settings/billing' },
  { label: 'AI', href: '/o/:orgSlug/settings/ai' },
];

const OrgSettingsNav = (props: { orgSlug: string }) => {
  const { orgSlug } = props;
  return (
    <nav>
      <ul className='flex flex-col'>
        {NAVS.map((nav) => {
          const href = nav.href.replace(':orgSlug', orgSlug);
          return (
            <Button
              key={nav.href}
              asChild
              variant='ghost'
              size='default'
              className='w-full justify-start rounded-none'
            >
              <Link href={href}>{nav.label}</Link>
            </Button>
          );
        })}
      </ul>
    </nav>
  );
};

export default async function Layout({ children, params }: LayoutProps<'/o/[orgSlug]'>) {
  const { orgSlug } = await params;

  return (
    <div className='h-screen grid grid-cols-[auto_1fr]'>
      <div className='h-full w-64 border-r'>
        <div className='h-12 border-b flex items-center gap-2 px-2'>
          <Button asChild variant='ghost' size='icon'>
            <Link href={`/o/${orgSlug}`}>
              <ArrowLeft />
            </Link>
          </Button>
          <h2 className='text-lg font-semibold'>Org Settings</h2>
        </div>
        <div className='mb-4'>
          <OrgSettingsNav orgSlug={orgSlug} />
        </div>
      </div>
      <main className='overflow-y-auto'>{children}</main>
    </div>
  );
}
