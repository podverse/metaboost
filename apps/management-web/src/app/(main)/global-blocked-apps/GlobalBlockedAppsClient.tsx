'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

import { getManagementApiBaseUrl } from '../../../config/env';

import styles from './GlobalBlockedAppsClient.module.scss';

type ManagementRegistryAppItem = {
  appId: string;
  displayName: string;
  status: 'active' | 'suspended' | 'revoked';
  globallyBlocked: boolean;
  globalBlockedId: string | null;
  globalBlockNote: string | null;
  blockedEverywhere: boolean;
  blockedEverywhereReason: 'registry' | 'global_override' | null;
};

export function GlobalBlockedAppsClient() {
  const t = useTranslations('buckets');
  const tCommon = useTranslations('common');
  const baseUrl = getManagementApiBaseUrl();
  const [apps, setApps] = useState<ManagementRegistryAppItem[]>([]);
  const [loading, setLoading] = useState(true);
  /** In-flight toggles (do not `disabled` the checkbox — that reverts controlled `checked` before fetch runs). */
  const inFlight = useRef<Set<string>>(new Set());

  const listApps = useCallback(async (): Promise<ManagementRegistryAppItem[]> => {
    const res = await request<{ apps?: ManagementRegistryAppItem[] }>(baseUrl, '/apps', {
      cache: 'no-store',
    });
    if (!res.ok || res.data === undefined || !Array.isArray(res.data.apps)) {
      return [];
    }
    return res.data.apps;
  }, [baseUrl]);

  const load = useCallback(
    async (options?: { showLoadingOverlay?: boolean }): Promise<void> => {
      const showLoadingOverlay = options?.showLoadingOverlay !== false;
      if (showLoadingOverlay) {
        setLoading(true);
      }
      setApps(await listApps());
      setLoading(false);
    },
    [listApps]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const sortedApps = useMemo(
    () => [...apps].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [apps]
  );

  const handleToggleGlobalBlocked = useCallback(
    async (app: ManagementRegistryAppItem, nextGlobalBlocked: boolean): Promise<void> => {
      if (inFlight.current.has(app.appId)) {
        return;
      }
      inFlight.current.add(app.appId);
      try {
        if (nextGlobalBlocked) {
          await request(baseUrl, '/apps/global-blocked', {
            method: 'POST',
            body: JSON.stringify({ appId: app.appId }),
          });
        } else {
          await request(baseUrl, `/apps/global-blocked/${encodeURIComponent(app.appId)}`, {
            method: 'DELETE',
          });
        }
        await load({ showLoadingOverlay: false });
      } finally {
        inFlight.current.delete(app.appId);
      }
    },
    [baseUrl, load]
  );

  if (loading) {
    return <Text variant="muted">{tCommon('loading')}</Text>;
  }

  return (
    <SectionWithHeading title={t('blockedAppsGlobalPageHeading')}>
      <Stack>
        <Text variant="muted">{t('blockedAppsGlobalPageDescription')}</Text>
        {sortedApps.length === 0 ? (
          <Text variant="muted">{t('blockedAppsEmpty')}</Text>
        ) : (
          <Table.ScrollContainer>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>{t('blockedAppsNameColumn')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('blockedAppsStatusColumn')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('blockedAppsGlobalBlockedColumn')}</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {sortedApps.map((app) => {
                  const registryBlocked = app.blockedEverywhereReason === 'registry';
                  return (
                    <Table.Row key={app.appId}>
                      <Table.Cell>{app.displayName}</Table.Cell>
                      <Table.Cell>
                        <span className={styles.statusText}>{app.status}</span>
                        {registryBlocked ? (
                          <Tooltip content={t('blockedAppsRegistryDisabledTooltip')}>
                            <InfoIcon size={16} />
                          </Tooltip>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell>
                        <CheckboxField
                          label={t('blockedAppsGlobalBlockedLabel')}
                          checked={app.globallyBlocked}
                          disabled={registryBlocked}
                          onChange={(checked) => {
                            void handleToggleGlobalBlocked(app, checked);
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
