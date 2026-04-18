'use client';

import type { BucketBlockedSender } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import { Button, Input, SectionWithHeading, Stack, Table, Text } from '@metaboost/ui';

import { getApiBaseUrl } from '../../../../../lib/api-client';

export type BucketBlockedSendersClientProps = {
  bucketId: string;
  initialBlockedSenders: BucketBlockedSender[];
};

export function BucketBlockedSendersClient({
  bucketId,
  initialBlockedSenders,
}: BucketBlockedSendersClientProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (q === '') {
      return initialBlockedSenders;
    }
    return initialBlockedSenders.filter((row) => {
      const name = (row.labelSnapshot ?? '').toLowerCase();
      const guid = row.senderGuid.toLowerCase();
      return name.includes(q) || guid.includes(q);
    });
  }, [filter, initialBlockedSenders]);

  const handleRemove = async (blockedSenderId: string): Promise<void> => {
    setRemovingId(blockedSenderId);
    const baseUrl = getApiBaseUrl();
    const res = await webBuckets.reqDeleteBlockedSender(baseUrl, bucketId, blockedSenderId);
    setRemovingId(null);
    if (res.ok) {
      router.refresh();
    }
  };

  const displayName = (row: BucketBlockedSender): string => {
    const s = row.labelSnapshot;
    return s !== null && s !== '' ? s : t('blockedNameAnonymous');
  };

  return (
    <SectionWithHeading title={t('blockedSendersHeading')}>
      <Stack>
        <Text variant="muted">{t('blockedSendersDescription')}</Text>
        <Input
          label={t('blockedSendersFilterLabel')}
          value={filter}
          onChange={setFilter}
          autoComplete="off"
        />
        {filtered.length === 0 ? (
          <Text variant="muted">{t('blockedSendersEmpty')}</Text>
        ) : (
          <Table.ScrollContainer>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>{t('blockedSendersNameColumn')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('blockedSendersGuidColumn')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('blockedSendersDateColumn')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('actions')}</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {filtered.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell>{displayName(row)}</Table.Cell>
                    <Table.Cell>
                      <code>{row.senderGuid}</code>
                    </Table.Cell>
                    <Table.Cell>{new Date(row.createdAt).toLocaleString()}</Table.Cell>
                    <Table.Cell>
                      <Button
                        type="button"
                        variant="secondary"
                        loading={removingId === row.id}
                        onClick={() => void handleRemove(row.id)}
                      >
                        {t('removeFromBlockedList')}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
    </SectionWithHeading>
  );
}
