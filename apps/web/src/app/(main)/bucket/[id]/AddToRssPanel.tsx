'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import { Button, Card, CodeSnippetBox, Row, Stack, Text } from '@metaboost/ui';

import { getMb1BoostPublicUrl } from '../../../../config/env';
import { getApiBaseUrl } from '../../../../lib/api-client';

type AddToRssPanelProps = {
  bucketShortId: string;
  bucketId: string;
  rssFeedUrl: string | null;
  initialVerifiedAt: string | null;
  initialVerificationFailedAt: string | null;
};

export function AddToRssPanel({
  bucketShortId,
  bucketId,
  rssFeedUrl,
  initialVerifiedAt,
  initialVerificationFailedAt,
}: AddToRssPanelProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [verifiedAt, setVerifiedAt] = useState<string | null>(initialVerifiedAt);
  const [verificationFailedAt, setVerificationFailedAt] = useState<string | null>(
    initialVerificationFailedAt
  );
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    setVerifiedAt(initialVerifiedAt);
    setVerificationFailedAt(initialVerificationFailedAt);
    setFeedback(null);
  }, [initialVerifiedAt, initialVerificationFailedAt]);

  const snippet = useMemo(
    () =>
      `<podcast:metaBoost standard="mb1">${getMb1BoostPublicUrl(bucketShortId)}</podcast:metaBoost>`,
    [bucketShortId]
  );

  const verificationStatusLine =
    verificationFailedAt !== null ? (
      <Text as="p" size="sm" variant="error">
        {t('rssVerificationFailed', {
          failureDate: new Date(verificationFailedAt).toLocaleString(),
        })}
      </Text>
    ) : verifiedAt !== null ? (
      <Text as="p" size="sm">
        {`${t('rssLastVerifiedSuccessfully')}: ${new Date(verifiedAt).toLocaleString()}`}
      </Text>
    ) : (
      <Text as="p" size="sm">
        {t('rssNotVerifiedYet')}
      </Text>
    );

  const handleVerify = async (): Promise<void> => {
    setVerifyLoading(true);
    setFeedback(null);
    const baseUrl = getApiBaseUrl();
    const res = await webBuckets.reqPostVerifyRssChannel(baseUrl, bucketId);
    if (!res.ok) {
      setVerifiedAt(null);
      setVerificationFailedAt(new Date().toISOString());
      setFeedback({ type: 'error', message: res.error.message || t('rssVerifyFailed') });
      setVerifyLoading(false);
      return;
    }
    const nowIso = new Date().toISOString();
    setVerifiedAt(nowIso);
    setVerificationFailedAt(null);
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
      {verificationStatusLine}
      {feedback !== null ? (
        <Text as="p" size="sm" variant={feedback.type === 'success' ? 'muted' : 'error'}>
          {feedback.message}
        </Text>
      ) : null}
    </Stack>
  );
}
