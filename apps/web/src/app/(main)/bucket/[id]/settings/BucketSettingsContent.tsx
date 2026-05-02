'use client';

import type { RegistryBucketAppPolicyItem } from '../../../../../lib/buckets';
import type { BucketSettingsTab } from '../../../../../lib/routes';
import type { BucketForForm } from '../../../buckets/BucketForm';
import type { BucketBlockedSender } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useLayoutEffect } from 'react';

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
import { BucketBlockedAppsClient } from './BucketBlockedAppsClient';
import { BucketBlockedSendersClient } from './BucketBlockedSendersClient';
import { BucketSettingsDeleteClient } from './BucketSettingsDeleteClient';
import { useSetBucketSettingsTabsSlot } from './BucketSettingsTabsSlotContext';

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
    idText: string;
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
  registryApps: RegistryBucketAppPolicyItem[];
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
  registryApps,
  showBlockedSendersTab,
}: BucketSettingsContentProps) {
  const activeHref = bucketSettingsRoute(bucketId, activeTab);
  const t = useTranslations('buckets');
  const setTabsSlot = useSetBucketSettingsTabsSlot();

  useLayoutEffect(() => {
    if (setTabsSlot === null) return;
    setTabsSlot(
      <BucketSettingsTabs
        generalHref={bucketSettingsRoute(bucketId)}
        generalLabel={t('general')}
        currencyHref={bucketSettingsRoute(bucketId, 'currency')}
        currencyLabel={t('currency')}
        adminsHref={isTopLevel ? bucketSettingsAdminsRoute(bucketId) : undefined}
        adminsLabel={isTopLevel ? t('admins') : undefined}
        rolesHref={isTopLevel ? bucketSettingsRolesRoute(bucketId) : undefined}
        rolesLabel={isTopLevel ? t('roles') : undefined}
        blockedHref={showBlockedSendersTab ? bucketSettingsRoute(bucketId, 'blocked') : undefined}
        blockedLabel={showBlockedSendersTab ? t('blockedAppsTab') : undefined}
        deleteHref={canDeleteBucket ? bucketSettingsRoute(bucketId, 'delete') : undefined}
        deleteLabel={canDeleteBucket ? t('deleteSettingsTab') : undefined}
        activeHref={activeHref}
      />
    );
    return () => {
      setTabsSlot(null);
    };
  }, [activeHref, bucketId, canDeleteBucket, isTopLevel, setTabsSlot, showBlockedSendersTab, t]);

  return (
    <>
      {activeTab === 'general' || activeTab === 'currency' ? (
        <BucketForm
          mode="edit"
          bucket={bucket}
          successHref={
            activeTab === 'currency'
              ? bucketSettingsRoute(bucketId, 'currency')
              : bucketSettingsRoute(bucketId)
          }
          cancelHref={bucketDetailRoute(bucketId)}
          editSection={activeTab === 'currency' ? 'currency' : 'general'}
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
        <>
          <BucketBlockedAppsClient bucketId={bucketId} initialRegistryApps={registryApps} />
          <BucketBlockedSendersClient bucketId={bucketId} initialBlockedSenders={blockedSenders} />
        </>
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
