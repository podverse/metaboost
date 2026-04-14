'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import { Button, Card, CodeSnippetBox, Row, Stack, Text } from '@metaboost/ui';

import { getApiBaseUrl } from '../../../../lib/api-client';

type AddToRssPanelProps = {
  bucketShortId: string;
  bucketId: string;
  rssFeedUrl: string | null;
  initialVerifiedAt: string | null;
};

export function AddToRssPanel({
  bucketShortId,
  bucketId,
  rssFeedUrl,
  initialVerifiedAt,
}: AddToRssPanelProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [verifiedAt, setVerifiedAt] = useState<string | null>(initialVerifiedAt);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const snippet = useMemo(
    () =>
      `<podcast:metaBoost standard="mb1">https://api.metaboost.cc/v1/s/mb1/boost/${bucketShortId}/</podcast:metaBoost>`,
    [bucketShortId]
  );

  const verifiedStatusText =
    verifiedAt === null
      ? t('rssNotVerifiedYet')
      : `${t('rssLastVerifiedSuccessfully')}: ${new Date(verifiedAt).toLocaleString()}`;

  const handleVerify = async (): Promise<void> => {
    setVerifyLoading(true);
    setFeedback(null);
    const baseUrl = getApiBaseUrl();
    const res = await webBuckets.reqPostVerifyRssChannel(baseUrl, bucketId);
    if (!res.ok) {
      setFeedback({ type: 'error', message: res.error.message || t('rssVerifyFailed') });
      setVerifyLoading(false);
      return;
    }
    const nowIso = new Date().toISOString();
    setVerifiedAt(nowIso);
    setFeedback({ type: 'success', message: t('rssVerifySuccess') });
    setVerifyLoading(false);
    router.refresh();
  };

  return (
    <Stack>
      <Text as="p" size="sm">
        {t('addToRssInstructions')}
      </Text>
      <Card variant="surface">
        <CodeSnippetBox
          description={t('addToRssExpectedTag')}
          value={snippet}
          copyLabel={t('copySnippet')}
          copiedLabel={t('copied')}
          copyFailedLabel={t('copyFailed')}
          codeAriaLabel={t('addToRssExpectedTag')}
        />
      </Card>
      <Text as="p" size="sm">
        {t('rssFeedUrl')}: {rssFeedUrl ?? t('notAvailable')}
      </Text>
      <Row>
        <Button type="button" variant="primary" onClick={handleVerify} loading={verifyLoading}>
          {t('verifyMetaboostEnabled')}
        </Button>
      </Row>
      <Text as="p" size="sm">
        {verifiedStatusText}
      </Text>
      {feedback !== null ? (
        <Text as="p" size="sm" variant={feedback.type === 'success' ? 'muted' : 'error'}>
          {feedback.message}
        </Text>
      ) : null}
    </Stack>
  );
}
