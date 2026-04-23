'use client';

import type { RegistryBucketAppPolicyItem } from '../../../../../lib/buckets';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { request } from '@metaboost/helpers-requests';
import {
  CheckboxField,
  InfoIcon,
  SectionWithHeading,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getApiBaseUrl } from '../../../../../lib/api-client';

import styles from './BucketBlockedAppsClient.module.scss';

export type BucketBlockedAppsClientProps = {
  bucketId: string;
  initialRegistryApps: RegistryBucketAppPolicyItem[];
};

export function BucketBlockedAppsClient({
  bucketId,
  initialRegistryApps,
}: BucketBlockedAppsClientProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [pendingAppId, setPendingAppId] = useState<string | null>(null);

  const { controllableApps, siteWideApps } = useMemo(() => {
    const sorted = [...initialRegistryApps].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
    return {
      controllableApps: sorted.filter((a) => !a.globallyBlocked),
      siteWideApps: sorted.filter((a) => a.globallyBlocked),
    };
  }, [initialRegistryApps]);

  const handleToggleAllowed = useCallback(
    async (row: RegistryBucketAppPolicyItem, nextAllowed: boolean): Promise<void> => {
      setPendingAppId(row.appId);
      const baseUrl = getApiBaseUrl();
      try {
        if (nextAllowed) {
          if (row.bucketBlockedId !== null) {
            await request(baseUrl, `/buckets/${bucketId}/blocked-apps/${row.bucketBlockedId}`, {
              method: 'DELETE',
            });
          }
        } else if (!row.bucketBlocked) {
          await request(baseUrl, `/buckets/${bucketId}/blocked-apps`, {
            method: 'POST',
            body: JSON.stringify({
              appId: row.appId,
              appNameSnapshot: row.displayName,
            }),
          });
        }
        router.refresh();
      } finally {
        setPendingAppId(null);
      }
    },
    [bucketId, router]
  );

  const hasAnyRegistryApps = initialRegistryApps.length > 0;

  return (
    <SectionWithHeading title={t('blockedAppsHeading')}>
      <Stack>
        <Text variant="muted">{t('blockedAppsDescription')}</Text>
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
                              disabled={registryScopeDisabled || pendingAppId === row.appId}
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
