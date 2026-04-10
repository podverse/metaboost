'use client';

import type { TabItem } from '@boilerplate/ui';

import { Link, Tabs } from '@boilerplate/ui';

export type BucketDetailTabsClientProps = {
  items: TabItem[];
  activeHref: string;
};

export function BucketDetailTabsClient({ items, activeHref }: BucketDetailTabsClientProps) {
  return <Tabs items={items} LinkComponent={Link} activeHref={activeHref} exactMatch />;
}
