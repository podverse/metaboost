'use client';

import type { BucketSettingsTab } from '../../../../../lib/routes';
import type { BucketForForm } from '../../../buckets/BucketForm';

import { useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';

import { BucketSettingsTabs } from '@metaboost/ui';

import {
  bucketDetailRoute,
  bucketSettingsRoute,
  bucketSettingsAdminsRoute,
  bucketSettingsRolesRoute,
} from '../../../../../lib/routes';
import { BucketForm } from '../../../buckets/BucketForm';
import { BucketAdminsClient } from '../BucketAdminsClient';
import { BucketRolesClient } from '../BucketRolesClient';

type AdminRow = {
  id: string;
  bucketId: string;
  userId: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud?: number;
  createdAt: string;
  user: {
    id: string;
    shortId: string;
    email: string | null;
    username?: string | null;
    displayName: string | null;
  } | null;
};

type PendingInvitationRow = {
  id: string;
  token: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud?: number;
  status: string;
  expiresAt: string;
};

type BucketSettingsContentProps = {
  activeTab: BucketSettingsTab;
  bucketId: string;
  bucket: BucketForForm;
  ownerId: string;
  isTopLevel: boolean;
  admins: AdminRow[];
  pendingInvitations: PendingInvitationRow[];
};

export function BucketSettingsContent({
  activeTab,
  bucketId,
  bucket,
  ownerId,
  isTopLevel,
  admins,
  pendingInvitations,
}: BucketSettingsContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const currentHref =
    pathname !== null && pathname !== undefined
      ? `${pathname}${tabParam !== null && tabParam !== '' ? `?tab=${tabParam}` : ''}`
      : bucketSettingsRoute(bucketId, activeTab);
  const t = useTranslations('buckets');

  return (
    <>
      <BucketSettingsTabs
        generalHref={bucketSettingsRoute(bucketId)}
        generalLabel={t('general')}
        adminsHref={isTopLevel ? bucketSettingsAdminsRoute(bucketId) : undefined}
        adminsLabel={isTopLevel ? t('admins') : undefined}
        rolesHref={isTopLevel ? bucketSettingsRolesRoute(bucketId) : undefined}
        rolesLabel={isTopLevel ? t('roles') : undefined}
        activeHref={currentHref}
      />
      {activeTab === 'general' ? (
        <BucketForm
          mode="edit"
          bucket={bucket}
          successHref={bucketDetailRoute(bucketId)}
          cancelHref={bucketDetailRoute(bucketId)}
        />
      ) : activeTab === 'admins' ? (
        <BucketAdminsClient
          bucketId={bucketId}
          ownerId={ownerId}
          initialAdmins={admins}
          initialPendingInvitations={pendingInvitations}
        />
      ) : (
        <BucketRolesClient bucketId={bucketId} />
      )}
    </>
  );
}
