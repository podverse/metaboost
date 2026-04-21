'use client';

import type { BucketDetailNavTab, TabItem } from '@metaboost/ui';

import { useRouter } from 'next/navigation';

import { Link, Tabs, useBucketDetailTabNav } from '@metaboost/ui';

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
};

export function BucketDetailTabsClient({
  items,
  activeItemKey,
  bucketPath,
}: BucketDetailTabsClientProps) {
  const router = useRouter();
  const tabNav = useBucketDetailTabNav();
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
        router.push(`${bucketPath}?${new URLSearchParams({ tab: tabId }).toString()}`);
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
