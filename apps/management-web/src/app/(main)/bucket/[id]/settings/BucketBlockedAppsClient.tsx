'use client';

import type { RegistryBucketAppPolicyItem } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { managementWebBuckets } from '@metaboost/helpers-requests';
import {
  CheckboxField,
  InfoIcon,
  SectionWithHeading,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../../../../config/env';

import styles from './BucketBlockedAppsClient.module.scss';

export type BucketBlockedAppsClientProps = {
  bucketId: string;
};

export function BucketBlockedAppsClient({ bucketId }: BucketBlockedAppsClientProps) {
  const t = useTranslations('buckets');
  const tCommon = useTranslations('common');
  const baseUrl = getManagementApiBaseUrl();
  const [registryApps, setRegistryApps] = useState<RegistryBucketAppPolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAppId, setPendingAppId] = useState<string | null>(null);

  const listApps = useCallback(async (): Promise<RegistryBucketAppPolicyItem[]> => {
    const res = await managementWebBuckets.getRegistryAppPolicyForManagementBucket(
      baseUrl,
      bucketId
    );
    if (!res.ok || res.data === undefined || !Array.isArray(res.data.apps)) {
      return [];
    }
    return res.data.apps;
  }, [baseUrl, bucketId]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setRegistryApps(await listApps());
    setLoading(false);
  }, [listApps]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedApps = useMemo(
    () => [...registryApps].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [registryApps]
  );

  const handleToggleAllowed = useCallback(
    async (row: RegistryBucketAppPolicyItem, nextAllowed: boolean): Promise<void> => {
      setPendingAppId(row.appId);
      if (nextAllowed) {
        if (row.bucketBlockedId !== null) {
          const res = await managementWebBuckets.removeManagementBucketBlockedApp(
            baseUrl,
            bucketId,
            row.bucketBlockedId
          );
          if (!res.ok) {
            setPendingAppId(null);
            return;
          }
        }
      } else if (!row.bucketBlocked) {
        const res = await managementWebBuckets.addManagementBucketBlockedApp(baseUrl, bucketId, {
          appId: row.appId,
          appNameSnapshot: row.displayName,
        });
        if (!res.ok) {
          setPendingAppId(null);
          return;
        }
      }
      setPendingAppId(null);
      await load();
    },
    [baseUrl, bucketId, load]
  );

  if (loading) {
    return <Text variant="muted">{tCommon('loading')}</Text>;
  }

  return (
    <SectionWithHeading title={t('blockedAppsTreeHeading')}>
      <Stack>
        <Text variant="muted">{t('blockedAppsTreeDescription')}</Text>
        {sortedApps.length === 0 ? (
          <Text variant="muted">{t('blockedAppsEmpty')}</Text>
        ) : (
          <Table.ScrollContainer>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>{t('blockedAppsNameColumn')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('blockedAppsStatusColumn')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('blockedAppsAllowedColumn')}</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {sortedApps.map((row) => {
                  const allowed = !row.bucketBlocked;
                  const globallyDisabled = row.blockedEverywhere;
                  const disabledReason =
                    row.blockedEverywhereReason === 'registry'
                      ? t('blockedAppsRegistryDisabledTooltip')
                      : t('blockedAppsGlobalDisabledTooltip');
                  return (
                    <Table.Row key={row.appId}>
                      <Table.Cell>
                        <div
                          className={[
                            styles.appCell,
                            globallyDisabled ? styles.blockedEverywhere : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span>{row.displayName}</span>
                          {globallyDisabled ? (
                            <Tooltip content={disabledReason}>
                              <span className={styles.appLabel}>
                                <InfoIcon size={16} />
                              </span>
                            </Tooltip>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className={styles.statusText}>{row.status}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <CheckboxField
                          label={t('blockedAppsAllowedLabel')}
                          checked={allowed}
                          disabled={globallyDisabled || pendingAppId === row.appId}
                          onChange={(checked) => {
                            void handleToggleAllowed(row, checked);
                          }}
                        />
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
    </SectionWithHeading>
  );
}
