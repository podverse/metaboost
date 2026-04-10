'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { managementWebBuckets } from '@metaboost/helpers-requests';
import {
  Button,
  Input,
  FormActions,
  FormContainer,
  CheckboxField,
  InfoIcon,
  Link,
  Row,
  Stack,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../../../../config/env';

type NewChildBucketFormClientProps = {
  parentBucketId: string;
  successHref: string;
  cancelHref: string;
};

export function NewChildBucketFormClient({
  parentBucketId,
  successHref,
  cancelHref,
}: NewChildBucketFormClientProps) {
  const tBucketForm = useTranslations('common.bucketForm');
  const tBucketDetail = useTranslations('common.bucketDetail');
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (name.trim() === '') {
      setSubmitError(tBucketForm('nameRequired'));
      return;
    }
    setLoading(true);
    const baseUrl = getManagementApiBaseUrl();
    const res = await managementWebBuckets.createChildBucket(baseUrl, parentBucketId, {
      name: name.trim(),
      isPublic,
    });
    if (!res.ok) {
      setSubmitError(res.error?.message ?? tBucketForm('createFailed'));
      setLoading(false);
      return;
    }
    router.push(successHref);
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Stack>
        <Input
          label={tBucketForm('name')}
          type="text"
          value={name}
          onChange={setName}
          disabled={loading}
          required
        />
        <Row>
          <CheckboxField
            label={tBucketForm('isPublic')}
            checked={isPublic}
            onChange={setIsPublic}
            disabled={loading}
          />
          <Tooltip content={tBucketForm('publicTooltip')}>
            <InfoIcon size={18} />
          </Tooltip>
        </Row>
        {submitError !== null && (
          <Text variant="error" size="sm" as="p" role="alert">
            {submitError}
          </Text>
        )}
        <FormActions>
          <Link href={cancelHref}>
            <Button type="button" variant="secondary" disabled={loading}>
              {tBucketForm('cancel')}
            </Button>
          </Link>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            {tBucketDetail('addBucket')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
