'use client';

import type { CreateBucketBody } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { managementWebBuckets } from '@metaboost/helpers-requests';
import {
  Button,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Input,
  Row,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { ROUTES, bucketViewRoute } from '../../lib/routes';

export type BucketFormInitialValues = {
  name: string;
  isPublic: boolean;
  messageBodyMaxLength: number | null;
};

export type BucketFormProps = {
  mode: 'create' | 'edit';
  bucketId?: string;
  initialValues?: BucketFormInitialValues;
  /** For create mode: { value: userId, label: displayName or email }. */
  ownerOptions?: { value: string; label: string }[];
};

export function BucketForm({ mode, bucketId, initialValues, ownerOptions = [] }: BucketFormProps) {
  const router = useRouter();
  const t = useTranslations('common.bucketForm');
  const apiBaseUrl = getManagementApiBaseUrl();

  const [name, setName] = useState(initialValues?.name ?? '');
  const [ownerId, setOwnerId] = useState('');
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? true);
  const [messageBodyMaxLength, setMessageBodyMaxLength] = useState(
    initialValues?.messageBodyMaxLength !== undefined &&
      initialValues?.messageBodyMaxLength !== null
      ? String(initialValues.messageBodyMaxLength)
      : ''
  );
  const [nameTouched, setNameTouched] = useState(false);
  const [ownerTouched, setOwnerTouched] = useState(false);
  const [messageBodyMaxLengthTouched, setMessageBodyMaxLengthTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const noUsersForCreate = mode === 'create' && ownerOptions.length === 0;

  const nameError = nameTouched && name.trim() === '' ? t('nameRequired') : null;
  const ownerError =
    mode === 'create' && ownerTouched && ownerId.trim() === '' && !noUsersForCreate
      ? t('ownerRequired')
      : null;

  const messageBodyMaxLengthParsed =
    messageBodyMaxLength.trim() === '' ? null : parseInt(messageBodyMaxLength, 10);
  const messageBodyMaxLengthValid =
    messageBodyMaxLength.trim() === '' ||
    (Number.isInteger(messageBodyMaxLengthParsed) &&
      messageBodyMaxLengthParsed !== null &&
      messageBodyMaxLengthParsed > 0);
  const messageBodyMaxLengthError =
    mode === 'edit' && messageBodyMaxLengthTouched && !messageBodyMaxLengthValid
      ? t('messageBodyMaxLengthInvalid')
      : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNameTouched(true);
    if (mode === 'create') setOwnerTouched(true);
    if (name.trim() === '') return;
    if (mode === 'create') {
      if (noUsersForCreate || ownerId.trim() === '') return;
      setSubmitError(null);
      setLoading(true);
      try {
        const body: CreateBucketBody = {
          name: name.trim(),
          ownerId: ownerId.trim(),
          isPublic,
        };
        const res = await managementWebBuckets.createBucket(apiBaseUrl, body);
        if (!res.ok) {
          setSubmitError(res.error.message ?? t('createFailed'));
          return;
        }
        const id = res.data?.bucket?.id;
        if (id !== undefined) {
          router.push(bucketViewRoute(id));
        } else {
          router.push(ROUTES.BUCKETS);
        }
        router.refresh();
      } finally {
        setLoading(false);
      }
    } else {
      if (bucketId === undefined || !messageBodyMaxLengthValid) return;
      setSubmitError(null);
      setLoading(true);
      try {
        const body = {
          name: name.trim(),
          isPublic,
          messageBodyMaxLength:
            messageBodyMaxLength.trim() === '' ? null : messageBodyMaxLengthParsed,
        };
        const res = await managementWebBuckets.updateBucket(apiBaseUrl, bucketId, body);
        if (!res.ok) {
          setSubmitError(res.error.message ?? t('updateFailed'));
          return;
        }
        router.push(bucketViewRoute(bucketId));
        router.refresh();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <FormContainer
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <Stack>
        <Input
          label={t('name')}
          value={name}
          onChange={setName}
          onBlur={() => setNameTouched(true)}
          error={nameError}
          autoComplete="off"
        />
        {mode === 'create' && ownerOptions.length > 0 && (
          <Select
            label={t('owner')}
            options={[{ value: '', label: '—' }, ...ownerOptions]}
            value={ownerId}
            onChange={setOwnerId}
            onBlur={() => setOwnerTouched(true)}
            aria-required
          />
        )}
        {mode === 'create' && noUsersForCreate && (
          <Text variant="muted" role="alert">
            {t('noUsersAvailable')}
          </Text>
        )}
        {mode === 'create' && ownerError !== null && (
          <Text variant="error" role="alert">
            {ownerError}
          </Text>
        )}
        <Row>
          <CheckboxField label={t('isPublic')} checked={isPublic} onChange={setIsPublic} />
          <Tooltip content={t('publicTooltip')}>
            <InfoIcon size={18} />
          </Tooltip>
        </Row>
        {mode === 'edit' && (
          <Input
            label={t('messageBodyMaxLength')}
            type="number"
            min={1}
            value={messageBodyMaxLength}
            onChange={setMessageBodyMaxLength}
            onBlur={() => setMessageBodyMaxLengthTouched(true)}
            error={messageBodyMaxLengthError ?? undefined}
            placeholder={t('messageBodyMaxLengthPlaceholder')}
          />
        )}

        {submitError !== null && (
          <Text variant="error" role="alert">
            {submitError}
          </Text>
        )}

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              router.push(bucketId !== undefined ? bucketViewRoute(bucketId) : ROUTES.BUCKETS)
            }
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={noUsersForCreate || (mode === 'edit' && !messageBodyMaxLengthValid)}
          >
            {mode === 'create' ? t('createBucket') : t('saveChanges')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
