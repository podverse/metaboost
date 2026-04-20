'use client';

import type { ManagementBucketDetailContentProps } from '../../../../components/ManagementBucketDetailContent';
import type { BucketDetailBucket, BucketDetailNavTab, TabItem } from '@metaboost/ui';
import type { ReactNode } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { BucketDetailTabNavContext } from '@metaboost/ui';

import { ManagementBucketDetailContent } from '../../../../components/ManagementBucketDetailContent';
import { BucketDetailTabsClient } from './BucketDetailTabsClient';

function activeItemKeyFromTab(tab: BucketDetailNavTab, showMessagesTab: boolean): string {
  if (!showMessagesTab) {
    return 'tab-buckets';
  }
  return tab === 'buckets' ? 'tab-buckets' : 'tab-messages';
}

export type BucketDetailTabShellProps = Omit<
  ManagementBucketDetailContentProps,
  'actionArea' | 'messagesSlot' | 'buckets' | 'bucketsSortBy' | 'bucketsSortOrder'
> & {
  serverInitialTab: BucketDetailNavTab;
  bucketPath: string;
  tabItems: TabItem[];
  showMessagesTab: boolean;
  messagesSlot: ReactNode | undefined;
  childBucketsForContent: BucketDetailBucket[];
  bucketsSortBy: string | undefined;
  bucketsSortOrder: 'asc' | 'desc' | undefined;
};

export function BucketDetailTabShell({
  serverInitialTab,
  bucketPath,
  tabItems,
  showMessagesTab,
  messagesSlot,
  childBucketsForContent,
  bucketsSortBy,
  bucketsSortOrder,
  ...rest
}: BucketDetailTabShellProps) {
  const [activeTab, setActiveTab] = useState<BucketDetailNavTab>(() => serverInitialTab);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectTab = useCallback(
    (nextTab: BucketDetailNavTab) => {
      if (searchParams.toString() !== '') {
        router.push(pathname);
      }
      setActiveTab(nextTab);
    },
    [pathname, router, searchParams]
  );

  const tabNavValue = useMemo(() => ({ selectTab }), [selectTab]);

  const messagesSlotResolved =
    showMessagesTab && activeTab === 'messages' ? messagesSlot : undefined;

  const buckets = activeTab === 'buckets' ? childBucketsForContent : undefined;

  const bucketsSortForTable = activeTab === 'buckets' ? bucketsSortBy : undefined;
  const bucketsSortOrderForTable = activeTab === 'buckets' ? bucketsSortOrder : undefined;

  const activeItemKey = activeItemKeyFromTab(activeTab, showMessagesTab);

  return (
    <BucketDetailTabNavContext.Provider value={tabNavValue}>
      <ManagementBucketDetailContent
        {...rest}
        actionArea={
          <BucketDetailTabsClient
            items={tabItems}
            activeItemKey={activeItemKey}
            bucketPath={bucketPath}
          />
        }
        messagesSlot={messagesSlotResolved}
        buckets={buckets}
        bucketsSortBy={bucketsSortForTable}
        bucketsSortOrder={bucketsSortOrderForTable}
      />
    </BucketDetailTabNavContext.Provider>
  );
}
