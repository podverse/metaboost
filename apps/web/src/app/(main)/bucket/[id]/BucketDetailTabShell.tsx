'use client';

import type { WebBucketDetailContentProps } from '../../../../components/WebBucketDetailContent';
import type { Bucket } from '@metaboost/helpers-requests';
import type { BucketDetailBucket, BucketDetailNavTab, TabItem } from '@metaboost/ui';
import type { ReactNode } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { BucketDetailTabNavContext } from '@metaboost/ui';

import { WebBucketDetailContent } from '../../../../components/WebBucketDetailContent';
import { BucketDetailTabsClient } from './BucketDetailTabsClient';

function activeItemKeyFromTab(tab: BucketDetailNavTab): string {
  if (tab === 'buckets') {
    return 'tab-buckets';
  }
  if (tab === 'add-to-rss') {
    return 'tab-add-to-rss';
  }
  if (tab === 'endpoint') {
    return 'tab-endpoint';
  }
  return 'tab-messages';
}

function isMbEndpointFamily(type: Bucket['type']): boolean {
  return type === 'mb-root' || type === 'mb-mid' || type === 'mb-leaf';
}

export type BucketDetailTabShellProps = Omit<
  WebBucketDetailContentProps,
  | 'actionArea'
  | 'messagesSlot'
  | 'messagesSlotMaxWidth'
  | 'buckets'
  | 'bucketsSortBy'
  | 'bucketsSortOrder'
> & {
  /** Tab resolved on the server for hydration and whether messages were SSR-loaded. */
  serverInitialTab: BucketDetailNavTab;
  bucketPath: string;
  bucketType: Bucket['type'];
  tabItems: TabItem[];
  messagesPanel: ReactNode;
  addToRssPanel: ReactNode;
  endpointPanel: ReactNode;
  rssChannelBucketsPanel: ReactNode;
  childBucketsForContent: BucketDetailBucket[];
  bucketsSortBy: string | undefined;
  bucketsSortOrder: 'asc' | 'desc' | undefined;
};

export function BucketDetailTabShell({
  serverInitialTab,
  bucketPath,
  bucketType,
  tabItems,
  messagesPanel,
  addToRssPanel,
  endpointPanel,
  rssChannelBucketsPanel,
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
    (tab: BucketDetailNavTab) => {
      if (searchParams.toString() !== '') {
        router.push(pathname);
      }
      setActiveTab(tab);
    },
    [pathname, router, searchParams]
  );

  const tabNavValue = useMemo(() => ({ selectTab }), [selectTab]);

  const messagesSlot = useMemo(() => {
    if (activeTab === 'messages') {
      return messagesPanel;
    }
    if (activeTab === 'add-to-rss' && bucketType === 'rss-channel') {
      return addToRssPanel;
    }
    if (activeTab === 'endpoint' && isMbEndpointFamily(bucketType)) {
      return endpointPanel;
    }
    if (activeTab === 'buckets' && bucketType === 'rss-channel') {
      return rssChannelBucketsPanel;
    }
    return undefined;
  }, [activeTab, addToRssPanel, bucketType, endpointPanel, messagesPanel, rssChannelBucketsPanel]);

  const buckets =
    activeTab === 'buckets' && bucketType !== 'rss-channel' ? childBucketsForContent : undefined;

  const messagesSlotMaxWidth =
    activeTab === 'buckets' && bucketType === 'rss-channel' ? 'none' : 'readable';

  const bucketsSortForTable = activeTab === 'buckets' ? bucketsSortBy : undefined;
  const bucketsSortOrderForTable = activeTab === 'buckets' ? bucketsSortOrder : undefined;

  const activeItemKey = activeItemKeyFromTab(activeTab);

  return (
    <BucketDetailTabNavContext.Provider value={tabNavValue}>
      <WebBucketDetailContent
        {...rest}
        actionArea={
          <BucketDetailTabsClient
            items={tabItems}
            activeItemKey={activeItemKey}
            bucketPath={bucketPath}
          />
        }
        messagesSlot={messagesSlot}
        messagesSlotMaxWidth={messagesSlotMaxWidth}
        buckets={buckets}
        bucketsSortBy={bucketsSortForTable}
        bucketsSortOrder={bucketsSortOrderForTable}
      />
    </BucketDetailTabNavContext.Provider>
  );
}
