'use client';

import type { ManagementBucketDetailContentProps } from '../../../../components/ManagementBucketDetailContent';
import type { BucketDetailBucket, BucketDetailNavTab, TabItem } from '@metaboost/ui';
import type { ReactNode } from 'react';

import { useCallback, useMemo, useState } from 'react';

import {
  BucketDetailTabNavContext,
  mergeBucketDetailNavInCookie,
  useStripSearchParamsIfPresent,
} from '@metaboost/ui';

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
  navCookieName: string;
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
  navCookieName,
  tabItems,
  showMessagesTab,
  messagesSlot,
  childBucketsForContent,
  bucketsSortBy,
  bucketsSortOrder,
  ...rest
}: BucketDetailTabShellProps) {
  const [activeTab, setActiveTab] = useState<BucketDetailNavTab>(() => serverInitialTab);
  const { stripSearchParamsIfPresent } = useStripSearchParamsIfPresent();

  const selectTab = useCallback(
    (nextTab: BucketDetailNavTab) => {
      mergeBucketDetailNavInCookie(navCookieName, bucketPath, { tab: nextTab });
      stripSearchParamsIfPresent();
      setActiveTab(nextTab);
    },
    [bucketPath, navCookieName, stripSearchParamsIfPresent]
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
            navCookieName={navCookieName}
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
