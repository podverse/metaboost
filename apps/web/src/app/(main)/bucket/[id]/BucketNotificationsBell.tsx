'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Button, Text, Tooltip } from '@metaboost/ui';

import { useApplyToDescendantsModal } from '../../../../components/useApplyToDescendantsModal';
import { useBucketWebPushSubscription } from './useBucketWebPushSubscription';

export type BucketNotificationsBellProps = {
  bucketId: string;
  hasChildBuckets: boolean;
  initialEnabled: boolean;
  vapidPublicKey: string;
};

export function BucketNotificationsBell({
  bucketId,
  hasChildBuckets,
  initialEnabled,
  vapidPublicKey,
}: BucketNotificationsBellProps) {
  const t = useTranslations('buckets');
  const webPush = useBucketWebPushSubscription({
    bucketId,
    initialEnabled,
    vapidPublicKey,
  });

  const labels = useMemo(
    () => ({
      prompt: t('applySettingsScopePrompt'),
      thisBucketOnly: t('applySettingsScopeThisBucketOnly'),
      allSubBuckets: t('applySettingsScopeAllSubBuckets'),
    }),
    [t]
  );

  const descendantsModal = useApplyToDescendantsModal({
    loading: webPush.loading,
    labels,
    onResolved: async (enable, applyToDescendants) => {
      if (enable) {
        await webPush.enable(applyToDescendants);
      } else {
        await webPush.disable(applyToDescendants);
      }
    },
  });

  const onBellClick = () => {
    if (webPush.loading) {
      return;
    }
    webPush.clearError();
    const nextOn = !webPush.enabled;
    if (nextOn) {
      if (!webPush.vapidOk) {
        void webPush.enable(false);
        return;
      }
      if (hasChildBuckets) {
        descendantsModal.openFor(true);
        return;
      }
      void webPush.enable(false);
      return;
    }
    if (hasChildBuckets) {
      descendantsModal.openFor(false);
      return;
    }
    void webPush.disable(false);
  };

  const ariaLabel = webPush.enabled
    ? t('notificationBellAriaEnabled')
    : t('notificationBellAriaDisabled');
  const bellClass = webPush.enabled ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash';

  const button = (
    <Button
      type="button"
      variant="secondary"
      onClick={onBellClick}
      disabled={webPush.loading}
      loading={webPush.loading}
      aria-label={ariaLabel}
      aria-pressed={webPush.enabled}
    >
      <i className={bellClass} aria-hidden />
    </Button>
  );

  return (
    <>
      {!webPush.vapidOk && !webPush.enabled ? (
        <Tooltip content={t('notificationVapidMissing')}>{button}</Tooltip>
      ) : (
        <Tooltip content={t('notificationBellTooltip')}>{button}</Tooltip>
      )}
      {webPush.errorMessage !== null ? (
        <Text as="p" size="sm" variant="error" role="alert">
          {webPush.errorMessage}
        </Text>
      ) : null}
      {descendantsModal.modal}
    </>
  );
}
