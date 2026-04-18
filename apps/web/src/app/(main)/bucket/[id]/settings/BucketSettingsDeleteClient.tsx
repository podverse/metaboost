'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import { Button, ConfirmDeleteModal, SectionWithHeading, Stack, Text } from '@metaboost/ui';

import { getApiBaseUrl } from '../../../../../lib/api-client';

type BucketSettingsDeleteClientProps = {
  bucketId: string;
  bucketName: string;
  redirectAfterDeleteHref: string;
};

export function BucketSettingsDeleteClient({
  bucketId,
  bucketName,
  redirectAfterDeleteHref,
}: BucketSettingsDeleteClientProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDelete = async () => {
    setError(null);
    setDeleting(true);
    const baseUrl = getApiBaseUrl();
    const res = await webBuckets.reqDeleteBucket(baseUrl, bucketId);
    setDeleting(false);
    if (!res.ok) {
      setError(res.error?.message ?? t('settingsDeleteFailed'));
      return;
    }
    setModalOpen(false);
    router.push(redirectAfterDeleteHref);
  };

  return (
    <>
      <SectionWithHeading title={t('deleteSettingsTab')}>
        <Stack>
          <Text>{t('settingsDeleteIntro')}</Text>
          {error !== null && error !== '' ? <Text role="alert">{error}</Text> : null}
          <div>
            <Button type="button" variant="danger" onClick={() => setModalOpen(true)}>
              {t('settingsDeleteButton')}
            </Button>
          </div>
        </Stack>
      </SectionWithHeading>
      <ConfirmDeleteModal
        open={modalOpen}
        displayName={bucketName}
        translationKeyPrefix="buckets.settingsDeleteConfirm"
        onConfirm={runDelete}
        onCancel={() => setModalOpen(false)}
        confirmLoading={deleting}
      />
    </>
  );
}
