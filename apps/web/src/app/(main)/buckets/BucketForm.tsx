'use client';

import type { BucketType, MbBucketType, RssBucketType } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import {
  Button,
  ButtonLink,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Input,
  mergeBucketDetailNavInCookie,
  Modal,
  ModalDialogContent,
  OptionTileSelector,
  Row,
  Stack,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getApiBaseUrl } from '../../../lib/api-client';
import { BUCKET_DETAIL_NAV_COOKIE_NAME } from '../../../lib/cookies';
import { bucketDetailRoute, bucketNewRouteFromAncestry } from '../../../lib/routes';

const MIN_MESSAGE_BODY_MAX_LENGTH = 140;
const MAX_MESSAGE_BODY_MAX_LENGTH = 2500;
const MIN_MESSAGE_USD_CENTS_THRESHOLD = 0;
const MAX_MESSAGE_USD_CENTS_THRESHOLD = 2147483647;

type TopLevelBucketCreateType =
  | Extract<RssBucketType, 'rss-network' | 'rss-channel'>
  | Extract<MbBucketType, 'mb-root'>;

export type BucketForForm = {
  id: string;
  bucketType: BucketType;
  isTopLevel: boolean;
  name: string;
  isPublic: boolean;
  messageBodyMaxLength: number;
  minimumMessageUsdCents: number;
};

type BucketFormProps = {
  mode: 'create' | 'edit';
  bucket: BucketForForm | null;
  successHref: string;
  cancelHref: string;
};

type BucketUpdatePayload = {
  name?: string;
  isPublic?: boolean;
  messageBodyMaxLength?: number;
  minimumMessageUsdCents?: number;
  applyToDescendants?: boolean;
};

export function BucketForm({ mode, bucket, successHref, cancelHref }: BucketFormProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const [createType, setCreateType] = useState<TopLevelBucketCreateType>('rss-channel');
  const [name, setName] = useState(bucket?.name ?? '');
  const [rssFeedUrl, setRssFeedUrl] = useState('');
  const [isPublic, setIsPublic] = useState(bucket?.isPublic ?? true);
  const [messageBodyMaxLength, setMessageBodyMaxLength] = useState<string>(
    bucket?.messageBodyMaxLength !== undefined ? String(bucket.messageBodyMaxLength) : ''
  );
  const [minimumMessageUsdCents, setMinimumMessageUsdCents] = useState<string>(
    bucket?.minimumMessageUsdCents !== undefined ? String(bucket.minimumMessageUsdCents) : '0'
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApplyToDescendantsModal, setShowApplyToDescendantsModal] = useState(false);
  const [pendingEditBody, setPendingEditBody] = useState<BucketUpdatePayload | null>(null);
  const isNameEditable =
    mode !== 'edit' ||
    bucket?.bucketType === 'rss-network' ||
    bucket?.bucketType === 'mb-root' ||
    bucket?.bucketType === 'mb-mid' ||
    bucket?.bucketType === 'mb-leaf';

  const patchBucket = async (
    baseUrl: string,
    bucketId: string,
    body: BucketUpdatePayload
  ): Promise<{ ok: boolean; message?: string }> => {
    const res = await fetch(`${baseUrl}/buckets/${bucketId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        message: typeof data?.message === 'string' ? data.message : 'Failed to update bucket',
      };
    }
    return { ok: true };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    if (
      mode === 'create' &&
      (createType === 'rss-network' || createType === 'mb-root') &&
      !name.trim()
    ) {
      setSubmitError(t('name') + ' is required.');
      return;
    }
    if (mode === 'edit' && isNameEditable && !name.trim()) {
      setSubmitError(t('name') + ' is required.');
      return;
    }
    if (mode === 'create' && createType === 'rss-channel' && rssFeedUrl.trim() === '') {
      setSubmitError(t('rssFeedUrl') + ' is required.');
      return;
    }
    if (mode === 'edit') {
      const parsedMessageBodyMaxLength = parseInt(messageBodyMaxLength, 10);
      const messageBodyMaxLengthIsValid =
        Number.isInteger(parsedMessageBodyMaxLength) &&
        parsedMessageBodyMaxLength >= MIN_MESSAGE_BODY_MAX_LENGTH &&
        parsedMessageBodyMaxLength <= MAX_MESSAGE_BODY_MAX_LENGTH;
      if (!messageBodyMaxLengthIsValid) {
        setSubmitError(t('messageBodyMaxLengthInvalid'));
        return;
      }
      if (bucket?.isTopLevel === true) {
        const parsedMinimumMessageUsdCents = parseInt(minimumMessageUsdCents, 10);
        const minimumMessageUsdCentsIsValid =
          Number.isInteger(parsedMinimumMessageUsdCents) &&
          parsedMinimumMessageUsdCents >= MIN_MESSAGE_USD_CENTS_THRESHOLD &&
          parsedMinimumMessageUsdCents <= MAX_MESSAGE_USD_CENTS_THRESHOLD;
        if (!minimumMessageUsdCentsIsValid) {
          setSubmitError(t('minimumMessageUsdCentsInvalid'));
          return;
        }
      }
    }
    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const body: BucketUpdatePayload = {
      isPublic,
    };
    if (mode !== 'edit' || isNameEditable) {
      body.name = name.trim();
    }
    if (mode === 'edit') {
      body.messageBodyMaxLength = parseInt(messageBodyMaxLength, 10);
      if (bucket?.isTopLevel === true) {
        body.minimumMessageUsdCents = parseInt(minimumMessageUsdCents, 10);
      }
    }

    try {
      if (mode === 'create') {
        let createBody: webBuckets.CreateBucketBody;
        if (createType === 'rss-network') {
          createBody = { type: 'rss-network', name: name.trim(), isPublic };
        } else if (createType === 'mb-root') {
          createBody = { type: 'mb-root', name: name.trim(), isPublic };
        } else {
          createBody = { type: 'rss-channel', rssFeedUrl: rssFeedUrl.trim(), isPublic };
        }
        const res = await webBuckets.reqPostCreateBucket(baseUrl, createBody);
        if (!res.ok) {
          setSubmitError(res.error.message || 'Failed to create bucket');
          return;
        }
        if (res.data?.bucket === undefined) {
          setSubmitError('Failed to create bucket');
          return;
        }
        const created = res.data.bucket;
        if (createType === 'rss-channel') {
          const path = bucketDetailRoute(created.shortId);
          mergeBucketDetailNavInCookie(BUCKET_DETAIL_NAV_COOKIE_NAME, path, { tab: 'add-to-rss' });
          router.push(path);
          return;
        }
        if (createType === 'mb-root') {
          const path = bucketDetailRoute(created.shortId);
          mergeBucketDetailNavInCookie(BUCKET_DETAIL_NAV_COOKIE_NAME, path, { tab: 'endpoint' });
          router.push(path);
          return;
        }
        router.push(bucketNewRouteFromAncestry([created.shortId]));
        return;
      } else if (bucket !== null) {
        const settingsChanged =
          body.isPublic !== bucket.isPublic ||
          body.messageBodyMaxLength !== bucket.messageBodyMaxLength ||
          (bucket.isTopLevel === true &&
            body.minimumMessageUsdCents !== bucket.minimumMessageUsdCents);
        if (settingsChanged) {
          const childrenRes = await fetch(`${baseUrl}/buckets/${bucket.id}/buckets`, {
            credentials: 'include',
          });
          const childrenJson = await childrenRes.json().catch(() => ({}));
          const hasChildren = childrenRes.ok && (childrenJson?.buckets?.length ?? 0) > 0;
          if (hasChildren) {
            setPendingEditBody(body);
            setShowApplyToDescendantsModal(true);
            return;
          }
        }
        const patchResult = await patchBucket(baseUrl, bucket.id, body);
        if (!patchResult.ok) {
          setSubmitError(patchResult.message ?? 'Failed to update bucket');
          return;
        }
      }
      router.push(successHref);
    } catch {
      setSubmitError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Stack>
        {mode === 'create' && (
          <OptionTileSelector
            label={t('bucketTypeLabel')}
            options={[
              {
                value: 'rss-channel',
                label: t('bucketTypeRssChannel'),
                iconClassName: 'fa-solid fa-rss',
              },
              {
                value: 'rss-network',
                label: t('bucketTypeRssNetwork'),
                iconClassName: 'fa-solid fa-diagram-project',
              },
              {
                value: 'mb-root',
                label: t('bucketTypeCustom'),
                iconClassName: 'fa-solid fa-sliders',
              },
            ]}
            value={createType}
            onChange={(value) => {
              const nextType =
                value === 'rss-channel'
                  ? 'rss-channel'
                  : value === 'mb-root'
                    ? 'mb-root'
                    : 'rss-network';
              setCreateType(nextType);
              setSubmitError(null);
            }}
            disabled={loading}
          />
        )}
        {mode === 'create' && createType === 'rss-network' && (
          <>
            <Text as="p" size="sm">
              {t('bucketTypeRssNetworkDescription')}
            </Text>
            <Input
              label={t('name')}
              type="text"
              value={name}
              onChange={setName}
              disabled={loading}
              required
            />
          </>
        )}
        {mode === 'create' && createType === 'mb-root' && (
          <>
            <Text as="p" size="sm">
              {t('bucketTypeCustomDescription')}
            </Text>
            <Input
              label={t('name')}
              type="text"
              value={name}
              onChange={setName}
              disabled={loading}
              required
            />
          </>
        )}
        {mode === 'create' && createType === 'rss-channel' && (
          <>
            <Text as="p" size="sm">
              {t('bucketTypeRssChannelDescription')}
            </Text>
            <Input
              label={t('rssFeedUrl')}
              type="url"
              value={rssFeedUrl}
              onChange={setRssFeedUrl}
              disabled={loading}
              required
              placeholder={t('rssFeedUrlPlaceholder')}
            />
          </>
        )}
        {mode === 'edit' && (
          <Input
            label={t('name')}
            type="text"
            value={name}
            onChange={setName}
            disabled={loading || !isNameEditable}
            required={isNameEditable}
          />
        )}
        {mode === 'edit' && !isNameEditable && (
          <Text size="sm" variant="muted">
            {t('derivedBucketNameNotice')}
          </Text>
        )}
        {mode === 'edit' && (
          <Input
            label={t('messageBodyMaxLengthLabel')}
            type="number"
            min={MIN_MESSAGE_BODY_MAX_LENGTH}
            max={MAX_MESSAGE_BODY_MAX_LENGTH}
            value={messageBodyMaxLength}
            onChange={setMessageBodyMaxLength}
            disabled={loading}
            placeholder={t('messageBodyMaxLengthPlaceholder')}
            required
          />
        )}
        {mode === 'edit' && bucket?.isTopLevel === true && (
          <>
            <Input
              label={t('minimumMessageUsdCentsLabel')}
              type="number"
              min={MIN_MESSAGE_USD_CENTS_THRESHOLD}
              max={MAX_MESSAGE_USD_CENTS_THRESHOLD}
              value={minimumMessageUsdCents}
              onChange={setMinimumMessageUsdCents}
              disabled={loading}
              placeholder={t('minimumMessageUsdCentsPlaceholder')}
              required
            />
            <Text size="sm" variant="muted">
              {t('minimumMessageUsdCentsHelp')}
            </Text>
          </>
        )}
        <Row>
          <CheckboxField
            label={t('isPublic')}
            checked={isPublic}
            onChange={setIsPublic}
            disabled={loading}
          />
          <Tooltip content={t('publicTooltip')}>
            <InfoIcon size={18} />
          </Tooltip>
        </Row>
        {submitError !== null && (
          <Text variant="error" size="sm" as="p" role="alert">
            {submitError}
          </Text>
        )}
        <FormActions>
          <Button type="submit" variant="primary" loading={loading}>
            {mode === 'create' ? t('addBucket') : t('save')}
          </Button>
          <ButtonLink href={cancelHref} variant="secondary">
            {t('cancel')}
          </ButtonLink>
        </FormActions>
      </Stack>
      {showApplyToDescendantsModal && pendingEditBody !== null && bucket !== null ? (
        <Modal
          withBackdrop
          backdropOpaque
          onClose={loading ? undefined : () => setShowApplyToDescendantsModal(false)}
        >
          <ModalDialogContent
            actions={
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setSubmitError(null);
                    const patchResult = await patchBucket(
                      getApiBaseUrl(),
                      bucket.id,
                      pendingEditBody
                    );
                    if (!patchResult.ok) {
                      setSubmitError(patchResult.message ?? 'Failed to update bucket');
                      setLoading(false);
                      setShowApplyToDescendantsModal(false);
                      setPendingEditBody(null);
                      return;
                    }
                    setShowApplyToDescendantsModal(false);
                    setPendingEditBody(null);
                    setLoading(false);
                    router.push(successHref);
                  }}
                >
                  {t('applySettingsScopeThisBucketOnly')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={loading}
                  onClick={async () => {
                    setLoading(true);
                    setSubmitError(null);
                    const patchResult = await patchBucket(getApiBaseUrl(), bucket.id, {
                      ...pendingEditBody,
                      applyToDescendants: true,
                    });
                    if (!patchResult.ok) {
                      setSubmitError(patchResult.message ?? 'Failed to update bucket');
                      setLoading(false);
                      setShowApplyToDescendantsModal(false);
                      setPendingEditBody(null);
                      return;
                    }
                    setShowApplyToDescendantsModal(false);
                    setPendingEditBody(null);
                    setLoading(false);
                    router.push(successHref);
                  }}
                >
                  {t('applySettingsScopeAllSubBuckets')}
                </Button>
              </>
            }
          >
            <Text as="p">{t('applySettingsScopePrompt')}</Text>
          </ModalDialogContent>
        </Modal>
      ) : null}
    </FormContainer>
  );
}
