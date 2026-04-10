'use client';

import type { TabItem } from '@metaboost/ui';

import { Link, Tabs } from '@metaboost/ui';

export type BucketSettingsTabsProps = {
  generalHref: string;
  generalLabel: string;
  /** When provided, show General and Admins tabs. When omitted, only General tab. */
  adminsHref?: string;
  adminsLabel?: string;
  /** When provided, show Roles tab (after Admins). */
  rolesHref?: string;
  rolesLabel?: string;
  activeHref: string;
};

/**
 * Horizontal tabs for bucket settings: General, optionally Admins, optionally Roles.
 */
export function BucketSettingsTabs({
  generalHref,
  generalLabel,
  adminsHref,
  adminsLabel,
  rolesHref,
  rolesLabel,
  activeHref,
}: BucketSettingsTabsProps) {
  const items: TabItem[] = [{ href: generalHref, label: generalLabel }];
  if (adminsHref !== undefined && adminsLabel !== undefined) {
    items.push({ href: adminsHref, label: adminsLabel });
  }
  if (rolesHref !== undefined && rolesLabel !== undefined) {
    items.push({ href: rolesHref, label: rolesLabel });
  }
  return <Tabs items={items} LinkComponent={Link} activeHref={activeHref} exactMatch />;
}
