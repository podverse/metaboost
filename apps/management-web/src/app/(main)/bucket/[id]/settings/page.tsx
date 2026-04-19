import type { BucketSettingsTab } from '../../../../../lib/routes';
import type { ManagementBucket } from '@metaboost/helpers-requests';

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { BucketSettingsTabs } from '@metaboost/ui';

import { BucketForm } from '../../../../../components/buckets/BucketForm';
import { getServerManagementApiBaseUrl } from '../../../../../config/env';
import { hasReadPermission } from '../../../../../lib/main-nav';
import {
  bucketSettingsRoute,
  bucketSettingsAdminsRoute,
  bucketSettingsRolesRoute,
} from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
import { getCookieHeader } from '../../../../../lib/server-request';
import { BucketAdminsClient } from './BucketAdminsClient';
import { BucketBlockedAppsClient } from './BucketBlockedAppsClient';
import { BucketRolesClient } from './BucketRolesClient';

async function fetchBucket(id: string): Promise<ManagementBucket | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerManagementApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${id}`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as { bucket?: ManagementBucket };
  return data.bucket ?? null;
}

export default async function BucketSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const user = await getServerUser();
  if (user === null) notFound();

  const canReadBuckets =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketsCrud');
  if (!canReadBuckets) notFound();

  const canReadBucketAdmins =
    user.isSuperAdmin === true || hasReadPermission(user.permissions, 'bucketAdminsCrud');

  const { id } = await params;
  const bucket = await fetchBucket(id);
  if (bucket === null) notFound();
  const isTopLevel = bucket.parentBucketId === null;

  const resolvedSearch = searchParams !== undefined ? await searchParams : {};
  const tabParam = resolvedSearch.tab ?? 'general';
  const activeTab: BucketSettingsTab =
    tabParam === 'admins'
      ? 'admins'
      : tabParam === 'roles'
        ? 'roles'
        : tabParam === 'blocked'
          ? 'blocked'
          : 'general';
  const canUseAdminTabs = canReadBucketAdmins && isTopLevel;
  if (
    !canUseAdminTabs &&
    (activeTab === 'admins' || activeTab === 'roles' || activeTab === 'blocked')
  ) {
    notFound();
  }

  const t = await getTranslations('buckets');
  const generalHref = bucketSettingsRoute(id);

  const activeHref =
    activeTab === 'admins'
      ? bucketSettingsAdminsRoute(id)
      : activeTab === 'roles'
        ? bucketSettingsRolesRoute(id)
        : activeTab === 'blocked'
          ? bucketSettingsRoute(id, 'blocked')
          : generalHref;

  return (
    <>
      <BucketSettingsTabs
        generalHref={generalHref}
        generalLabel={t('general')}
        adminsHref={canUseAdminTabs ? bucketSettingsAdminsRoute(id) : undefined}
        adminsLabel={canUseAdminTabs ? t('admins') : undefined}
        rolesHref={canUseAdminTabs ? bucketSettingsRolesRoute(id) : undefined}
        rolesLabel={canUseAdminTabs ? t('roles') : undefined}
        blockedHref={canUseAdminTabs ? bucketSettingsRoute(id, 'blocked') : undefined}
        blockedLabel={canUseAdminTabs ? t('blockedAppsTab') : undefined}
        activeHref={activeHref}
      />
      {activeTab === 'general' ? (
        <BucketForm
          mode="edit"
          bucketId={id}
          initialValues={{
            name: bucket.name,
            isPublic: bucket.isPublic,
            messageBodyMaxLength: bucket.messageBodyMaxLength ?? 500,
          }}
        />
      ) : activeTab === 'admins' && canUseAdminTabs ? (
        <BucketAdminsClient bucketId={id} ownerId={bucket.ownerId} />
      ) : activeTab === 'roles' && canUseAdminTabs ? (
        <BucketRolesClient bucketId={id} />
      ) : activeTab === 'blocked' && canUseAdminTabs ? (
        <BucketBlockedAppsClient />
      ) : (
        notFound()
      )}
    </>
  );
}
