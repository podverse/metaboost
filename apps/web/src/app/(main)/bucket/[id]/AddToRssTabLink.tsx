'use client';

import { useRouter } from 'next/navigation';

import { Link, useBucketDetailTabNav } from '@metaboost/ui';

export type AddToRssTabLinkProps = {
  bucketPath: string;
  children: React.ReactNode;
  className?: string;
};

/** Switches to the Add to RSS tab (context, client state, or navigation with ?tab=). */
export function AddToRssTabLink({ bucketPath, children, className }: AddToRssTabLinkProps) {
  const tabNav = useBucketDetailTabNav();
  const router = useRouter();
  return (
    <Link
      href={bucketPath}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (tabNav !== null) {
          tabNav.selectTab('add-to-rss');
        } else {
          router.push(`${bucketPath}?${new URLSearchParams({ tab: 'add-to-rss' }).toString()}`);
        }
      }}
    >
      {children}
    </Link>
  );
}
