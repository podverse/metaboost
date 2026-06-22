'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { webAuth, webBuckets } from '@metaboost/helpers-requests';

import { getApiBaseUrl } from '../../../../config/env';
import {
  deleteServerSubscriptionIfMatches,
  subscriptionBodyFromPushSubscription,
  subscribeWithVapid,
  unsubscribeCurrentBrowserPush,
} from '../../../../lib/webPushBrowser';

export function useBucketWebPushSubscription(options: {
  bucketId: string;
  initialEnabled: boolean;
  vapidPublicKey: string;
}) {
  const t = useTranslations('buckets');
  const [enabled, setEnabled] = useState(options.initialEnabled);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const baseUrl = getApiBaseUrl();
  const vapidOk = options.vapidPublicKey.trim() !== '';

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const enable = useCallback(
    async (applyToDescendants: boolean) => {
      if (!vapidOk) {
        setErrorMessage(t('notificationVapidMissing'));
        return;
      }
      setLoading(true);
      setErrorMessage(null);
      try {
        if (typeof Notification === 'undefined') {
          setErrorMessage(t('notificationEnableFailed'));
          return;
        }
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setErrorMessage(t('notificationEnableFailed'));
          return;
        }
        const sub = await subscribeWithVapid(options.vapidPublicKey.trim());
        const subBody = subscriptionBodyFromPushSubscription(sub);
        const locale =
          typeof navigator !== 'undefined' && navigator.language.trim() !== ''
            ? navigator.language
            : null;
        const upsert = await webAuth.reqUpsertWebPushSubscription(
          baseUrl,
          { ...subBody, locale },
          {}
        );
        if (!upsert.ok) {
          setErrorMessage(t('notificationEnableFailed'));
          return;
        }
        const patch = await webBuckets.reqPatchBucketNotificationPreference(
          baseUrl,
          options.bucketId,
          { enabled: true, applyToDescendants },
          undefined
        );
        if (!patch.ok) {
          setErrorMessage(t('notificationEnableFailed'));
          return;
        }
        setEnabled(true);
      } catch {
        setErrorMessage(t('notificationEnableFailed'));
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, options.bucketId, options.vapidPublicKey, t, vapidOk]
  );

  const disable = useCallback(
    async (applyToDescendants: boolean) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const endpoint = await unsubscribeCurrentBrowserPush();
        if (endpoint !== null) {
          await deleteServerSubscriptionIfMatches(endpoint);
        }
        const patch = await webBuckets.reqPatchBucketNotificationPreference(
          baseUrl,
          options.bucketId,
          { enabled: false, applyToDescendants },
          undefined
        );
        if (!patch.ok) {
          setErrorMessage(t('notificationDisableFailed'));
          return;
        }
        setEnabled(false);
      } catch {
        setErrorMessage(t('notificationDisableFailed'));
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, options.bucketId, t]
  );

  return { enabled, loading, errorMessage, enable, disable, clearError, vapidOk };
}
