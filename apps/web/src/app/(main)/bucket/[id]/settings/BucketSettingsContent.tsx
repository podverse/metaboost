'use client';

import type { BucketSettingsTab } from '../../../../../lib/routes';
import type { BucketForForm } from '../../../buckets/BucketForm';
import type { BucketBlockedSender } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';

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
import { BucketBlockedSendersClient } from './BucketBlockedSendersClient';
import { BucketSettingsDeleteClient } from './BucketSettingsDeleteClient';

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
  canDeleteBucket: boolean;
  redirectAfterDeleteHref: string;
  blockedSenders: BucketBlockedSender[];
  showBlockedSendersTab: boolean;
};

export function BucketSettingsContent({
  activeTab,
  bucketId,
  bucket,
  ownerId,
  isTopLevel,
  admins,
  pendingInvitations,
  canDeleteBucket,
  redirectAfterDeleteHref,
  blockedSenders,
  showBlockedSendersTab,
}: BucketSettingsContentProps) {
  const activeHref = bucketSettingsRoute(bucketId, activeTab);
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
        blockedHref={showBlockedSendersTab ? bucketSettingsRoute(bucketId, 'blocked') : undefined}
        blockedLabel={showBlockedSendersTab ? t('blockedSendersTab') : undefined}
        deleteHref={canDeleteBucket ? bucketSettingsRoute(bucketId, 'delete') : undefined}
        deleteLabel={canDeleteBucket ? t('deleteSettingsTab') : undefined}
        activeHref={activeHref}
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
      ) : activeTab === 'roles' ? (
        <BucketRolesClient bucketId={bucketId} />
      ) : activeTab === 'blocked' ? (
        <BucketBlockedSendersClient bucketId={bucketId} initialBlockedSenders={blockedSenders} />
      ) : (
        <BucketSettingsDeleteClient
          bucketId={bucketId}
          bucketName={bucket.name}
          redirectAfterDeleteHref={redirectAfterDeleteHref}
        />
      )}
    </>
  );
}
