'use client';

import {
  Link,
  mergeBucketDetailNavInCookie,
  useBucketDetailTabNav,
  useCookieModeListRefresh,
} from '@metaboost/ui';

export type AddToRssTabLinkProps = {
  bucketPath: string;
  navCookieName: string;
  children: React.ReactNode;
  className?: string;
};

/** Switches to the Add to RSS tab without putting ?tab= in the URL (cookie + refresh). */
export function AddToRssTabLink({
  bucketPath,
  navCookieName,
  children,
  className,
}: AddToRssTabLinkProps) {
  const tabNav = useBucketDetailTabNav();
  const { afterCookieListMutation } = useCookieModeListRefresh(undefined);
  return (
    <Link
      href={bucketPath}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (tabNav !== null) {
          tabNav.selectTab('add-to-rss');
        } else {
          mergeBucketDetailNavInCookie(navCookieName, bucketPath, { tab: 'add-to-rss' });
          void afterCookieListMutation();
        }
      }}
    >
      {children}
    </Link>
  );
}
