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

  const sortedApps = useMemo(
    () => [...initialRegistryApps].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [initialRegistryApps]
  );

  const handleToggleAllowed = useCallback(
    async (row: RegistryBucketAppPolicyItem, nextAllowed: boolean): Promise<void> => {
      setPendingAppId(row.appId);
      const baseUrl = getApiBaseUrl();
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
      setPendingAppId(null);
      router.refresh();
    },
    [bucketId, router]
  );

  return (
    <SectionWithHeading title={t('blockedAppsHeading')}>
      <Stack>
        <Text variant="muted">{t('blockedAppsDescription')}</Text>
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
