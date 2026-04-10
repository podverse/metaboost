'use client';

import type { TabItem } from '@metaboost/ui';

import { Link, Tabs } from '@metaboost/ui';

export type NavTabsProps = {
  /** Visible nav items (filtered by read permissions in layout). */
  items: TabItem[];
};

export function NavTabs({ items }: NavTabsProps) {
  return <Tabs items={items} LinkComponent={Link} />;
}
