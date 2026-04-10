'use client';

import type { TabItem } from '@metaboost/ui';

import { Link, Tabs } from '@metaboost/ui';

export type BucketDetailTabsClientProps = {
  items: TabItem[];
  activeHref: string;
};

export function BucketDetailTabsClient({ items, activeHref }: BucketDetailTabsClientProps) {
  return <Tabs items={items} LinkComponent={Link} activeHref={activeHref} exactMatch />;
}
