'use client';

import type { RegistryBucketAppPolicyItem } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  /** In-flight toggles (do not `disabled` the checkbox — that reverts controlled `checked` before fetch runs). */
  const inFlight = useRef<Set<string>>(new Set());

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

  const load = useCallback(
    async (options?: { showLoadingOverlay?: boolean }): Promise<void> => {
      const showLoadingOverlay = options?.showLoadingOverlay !== false;
      if (showLoadingOverlay) {
        setLoading(true);
      }
      setRegistryApps(await listApps());
      setLoading(false);
    },
    [listApps]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const { controllableApps, siteWideApps } = useMemo(() => {
    const sorted = [...registryApps].sort((a, b) => a.displayName.localeCompare(b.displayName));
    return {
      controllableApps: sorted.filter((a) => !a.globallyBlocked),
      siteWideApps: sorted.filter((a) => a.globallyBlocked),
    };
  }, [registryApps]);

  const handleToggleAllowed = useCallback(
    async (row: RegistryBucketAppPolicyItem, nextAllowed: boolean): Promise<void> => {
      if (inFlight.current.has(row.appId)) {
        return;
      }
      inFlight.current.add(row.appId);
      try {
        if (nextAllowed) {
          if (row.bucketBlockedId !== null) {
            const res = await managementWebBuckets.removeManagementBucketBlockedApp(
              baseUrl,
              bucketId,
              row.bucketBlockedId
            );
            if (!res.ok) {
              return;
            }
          }
        } else if (!row.bucketBlocked) {
          const res = await managementWebBuckets.addManagementBucketBlockedApp(baseUrl, bucketId, {
            appId: row.appId,
            appNameSnapshot: row.displayName,
          });
          if (!res.ok) {
            return;
          }
        }
        await load({ showLoadingOverlay: false });
      } finally {
        inFlight.current.delete(row.appId);
      }
    },
    [baseUrl, bucketId, load]
  );

  if (loading) {
    return <Text variant="muted">{tCommon('loading')}</Text>;
  }

  const hasAnyRegistryApps = registryApps.length > 0;

  return (
    <SectionWithHeading title={t('blockedAppsTreeHeading')}>
      <Stack>
        <Text variant="muted">{t('blockedAppsTreeDescription')}</Text>
        {!hasAnyRegistryApps ? (
          <Text variant="muted">{t('blockedAppsEmpty')}</Text>
        ) : (
          <Stack>
            {controllableApps.length > 0 ? (
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
                    {controllableApps.map((row) => {
                      const allowed = !row.bucketBlocked;
                      const registryScopeDisabled = row.blockedEverywhereReason === 'registry';
                      return (
                        <Table.Row key={row.appId}>
                          <Table.Cell>
                            <div
                              className={[
                                styles.appCell,
                                registryScopeDisabled ? styles.blockedEverywhere : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <span>{row.displayName}</span>
                              {registryScopeDisabled ? (
                                <Tooltip content={t('blockedAppsRegistryDisabledTooltip')}>
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
                              disabled={registryScopeDisabled}
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
            ) : null}
            {controllableApps.length === 0 && siteWideApps.length > 0 ? (
              <Text variant="muted">{t('blockedAppsControllableAllSiteWide')}</Text>
            ) : null}
            {siteWideApps.length > 0 ? (
              <details
                className={styles.siteWideDetails}
                aria-label={t('blockedAppsSiteWideTableAria')}
              >
                <summary className={styles.siteWideSummary}>
                  {t('blockedAppsSiteWideSectionSummary', { count: siteWideApps.length })}
                </summary>
                <Stack>
                  <Text variant="muted">{t('blockedAppsSiteWideSectionDescription')}</Text>
                  <Table.ScrollContainer>
                    <Table>
                      <Table.Head>
                        <Table.Row>
                          <Table.HeaderCell>{t('blockedAppsNameColumn')}</Table.HeaderCell>
                          <Table.HeaderCell>{t('blockedAppsStatusColumn')}</Table.HeaderCell>
                          <Table.HeaderCell>
                            {t('blockedAppsSiteWidePolicyColumn')}
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Head>
                      <Table.Body>
                        {siteWideApps.map((row) => (
                          <Table.Row key={row.appId}>
                            <Table.Cell>
                              <div className={styles.appCell}>
                                <span>{row.displayName}</span>
                                <Tooltip content={t('blockedAppsGlobalDisabledTooltip')}>
                                  <span className={styles.appLabel}>
                                    <InfoIcon size={16} />
                                  </span>
                                </Tooltip>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className={styles.statusText}>{row.status}</span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className={styles.siteWidePolicyValue}>
                                {t('blockedAppsGlobalBlockedLabel')}
                              </span>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </details>
            ) : null}
          </Stack>
        )}
      </Stack>
    </SectionWithHeading>
  );
}
