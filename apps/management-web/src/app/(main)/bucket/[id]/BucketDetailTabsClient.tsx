'use client';

import type { BucketDetailNavTab, TabItem } from '@metaboost/ui';

import {
  Link,
  mergeBucketDetailNavInCookie,
  Tabs,
  useBucketDetailTabNav,
  useCookieModeListRefresh,
} from '@metaboost/ui';

function tabIdFromItemKey(itemKey: string | undefined): BucketDetailNavTab | undefined {
  if (itemKey === undefined) return undefined;
  if (itemKey === 'tab-messages') return 'messages';
  if (itemKey === 'tab-buckets') return 'buckets';
  return undefined;
}

export type BucketDetailTabsClientProps = {
  items: TabItem[];
  activeItemKey: string;
  bucketPath: string;
  navCookieName: string;
};

export function BucketDetailTabsClient({
  items,
  activeItemKey,
  bucketPath,
  navCookieName,
}: BucketDetailTabsClientProps) {
  const tabNav = useBucketDetailTabNav();
  const { afterCookieListMutation } = useCookieModeListRefresh(undefined);
  const mappedItems = items.map((item) => {
    const tabId = tabIdFromItemKey(item.itemKey);
    const isCookieTab = tabId !== undefined && item.href === bucketPath;
    if (!isCookieTab) {
      return item;
    }
    if (tabNav !== null) {
      return {
        ...item,
        linkOnClick: (e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          tabNav.selectTab(tabId);
        },
      };
    }
    return {
      ...item,
      linkOnClick: (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        mergeBucketDetailNavInCookie(navCookieName, bucketPath, { tab: tabId });
        void afterCookieListMutation();
      },
    };
  });

  return (
    <Tabs
      items={mappedItems}
      LinkComponent={Link}
      activeHref={bucketPath}
      activeItemKey={activeItemKey}
      exactMatch
    />
  );
}
