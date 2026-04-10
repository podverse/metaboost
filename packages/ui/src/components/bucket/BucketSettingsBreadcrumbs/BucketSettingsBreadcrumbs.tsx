'use client';

import type { BreadcrumbItem } from '@boilerplate/ui';

import { Breadcrumbs, Link } from '@boilerplate/ui';

export type BucketSettingsBreadcrumbsProps = {
  /** Optional parent buckets in hierarchy order (root first). When set, shown before the current bucket. */
  ancestorItems?: BreadcrumbItem[];
  bucketName: string;
  bucketDetailHref: string;
  settingsHref: string;
  settingsLabel: string;
  settingsAriaLabel: string;
  /** Title of the current page (last breadcrumb, text only). */
  currentPageLabel: string;
  /** When true, show bucket → Settings → Admins before current page. */
  isEditAdminPage?: boolean;
  adminsHref?: string;
  adminsLabel?: string;
  /** When true, show bucket → Settings → Roles before current page. */
  isRolePage?: boolean;
  rolesHref?: string;
  rolesLabel?: string;
};

function LinkAdapter({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * Breadcrumb for bucket settings. Default: bucket name only.
 * When isEditAdminPage and adminsHref/adminsLabel provided: bucket → Settings → Admins.
 */
export function BucketSettingsBreadcrumbs({
  ancestorItems = [],
  bucketName,
  bucketDetailHref,
  settingsHref,
  settingsLabel,
  settingsAriaLabel,
  currentPageLabel,
  isEditAdminPage = false,
  adminsHref,
  adminsLabel,
  isRolePage = false,
  rolesHref,
  rolesLabel,
}: BucketSettingsBreadcrumbsProps) {
  const items: BreadcrumbItem[] = [
    ...ancestorItems,
    { label: bucketName, href: bucketDetailHref },
    { label: settingsLabel, href: settingsHref },
  ];
  if (isEditAdminPage && adminsHref !== undefined && adminsLabel !== undefined) {
    items.push({ label: adminsLabel, href: adminsHref });
  }
  if (isRolePage && rolesHref !== undefined && rolesLabel !== undefined) {
    items.push({ label: rolesLabel, href: rolesHref });
  }
  if (currentPageLabel !== settingsLabel || isEditAdminPage || isRolePage) {
    items.push({ label: currentPageLabel, href: undefined });
  }
  return <Breadcrumbs items={items} LinkComponent={LinkAdapter} ariaLabel={settingsAriaLabel} />;
}
