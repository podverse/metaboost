'use client';

import type { BreadcrumbItem } from '@metaboost/ui';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import {
  BucketSettingsBreadcrumbs,
  BucketSettingsLayoutClient as UISettingsLayout,
} from '@metaboost/ui';

import {
  bucketDetailRoute,
  bucketPathFromAncestry,
  bucketSettingsRoute,
  bucketSettingsAdminsRoute,
  bucketSettingsRolesRoute,
} from '../../../../../lib/routes';
import { BucketSettingsFullWidthBelowSetterProvider } from './BucketSettingsFullWidthBelowContext';

type BucketSettingsLayoutClientProps = {
  bucketId: string;
  bucketName: string;
  bucketSettingsTitle: string;
  /** Parent buckets in hierarchy order (root first) for breadcrumbs. */
  ancestorItems?: BreadcrumbItem[];
  children: React.ReactNode;
};

function isEditAdminPath(pathname: string | null, bucketId: string): boolean {
  if (pathname === null || pathname === undefined) return false;
  const prefix = bucketPathFromAncestry([bucketId]) + '/settings/admins/';
  return pathname.startsWith(prefix) && pathname.endsWith('/edit');
}

function isRolePagePath(pathname: string | null, bucketId: string): boolean {
  if (pathname === null || pathname === undefined) return false;
  const prefix = bucketPathFromAncestry([bucketId]) + '/settings/roles/';
  return pathname.startsWith(prefix);
}

export function BucketSettingsLayoutClient({
  bucketId,
  bucketName,
  bucketSettingsTitle,
  ancestorItems = [],
  children,
}: BucketSettingsLayoutClientProps) {
  const pathname = usePathname();
  const [fullWidthBelow, setFullWidthBelow] = useState<React.ReactNode>(null);
  const t = useTranslations('buckets');
  const isEditAdminPage = isEditAdminPath(pathname, bucketId);
  const isRolePage = isRolePagePath(pathname, bucketId);
  const roleNewPath = bucketPathFromAncestry([bucketId]) + '/settings/roles/new';
  const isRoleNewPage = pathname === roleNewPath;
  const currentPageLabel = isEditAdminPage
    ? t('editAdminTitle')
    : isRolePage
      ? isRoleNewPage
        ? t('createRole')
        : t('editRole')
      : bucketSettingsTitle;

  return (
    <BucketSettingsFullWidthBelowSetterProvider value={setFullWidthBelow}>
      <UISettingsLayout
        breadcrumbs={
          <BucketSettingsBreadcrumbs
            ancestorItems={ancestorItems}
            bucketName={bucketName}
            bucketDetailHref={bucketDetailRoute(bucketId)}
            settingsHref={bucketSettingsRoute(bucketId)}
            settingsLabel={t('bucketSettings')}
            settingsAriaLabel={t('bucketSettings')}
            currentPageLabel={currentPageLabel}
            isEditAdminPage={isEditAdminPage}
            adminsHref={bucketSettingsAdminsRoute(bucketId)}
            adminsLabel={t('admins')}
            isRolePage={isRolePage}
            rolesHref={bucketSettingsRolesRoute(bucketId)}
            rolesLabel={t('roles')}
          />
        }
        title={isEditAdminPage ? undefined : bucketSettingsTitle}
        contentMaxWidth="form"
        fullWidthBelow={fullWidthBelow}
      >
        {children}
      </UISettingsLayout>
    </BucketSettingsFullWidthBelowSetterProvider>
  );
}
