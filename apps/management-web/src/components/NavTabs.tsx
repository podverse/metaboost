'use client';

import type { TabItem } from '@boilerplate/ui';

import { Link, Tabs } from '@boilerplate/ui';

export type NavTabsProps = {
  /** Visible nav items (filtered by read permissions in layout). */
  items: TabItem[];
};

export function NavTabs({ items }: NavTabsProps) {
  return <Tabs items={items} LinkComponent={Link} />;
}
