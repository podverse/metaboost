'use client';

import type { Bucket, CreateBucketBody } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR,
  MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR,
} from '@metaboost/helpers';
import {
  getCurrencyDenominationSpec,
  SUPPORTED_CURRENCIES_ORDERED,
} from '@metaboost/helpers-currency';
import { managementWebBuckets } from '@metaboost/helpers-requests';
import {
  Button,
  CheckboxField,
  FormActions,
  FormContainer,
  InfoIcon,
  Input,
  Modal,
  ModalDialogContent,
  Row,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@metaboost/ui';

import { getManagementApiBaseUrl, getManagementWebBrandName } from '../../config/env';
import { ROUTES, bucketViewRoute } from '../../lib/routes';

const MIN_MESSAGE_BODY_MAX_LENGTH = 140;
const MAX_MESSAGE_BODY_MAX_LENGTH = 2500;

export type BucketFormInitialValues = {
  bucketType?: Bucket['type'];
  isTopLevel?: boolean;
  name: string;
  isPublic: boolean;
  messageBodyMaxLength: number;
  preferredCurrency: string;
  publicBoostDisplayMinimumMinor: number;
};

type BucketFormEditSection = 'general' | 'currency';

export type BucketFormProps = {
  mode: 'create' | 'edit';
  bucketId?: string;
  initialValues?: BucketFormInitialValues;
  /** For create mode: { value: userId, label: displayName or email }. */
  ownerOptions?: { value: string; label: string }[];
  editSection?: BucketFormEditSection;
};

function getMinorUnitI18nKey(currencyCode: string): string {
  const unit = getCurrencyDenominationSpec(currencyCode)?.canonicalAmountUnit ?? 'cents';
  if (
    unit === 'cents' ||
    unit === 'satoshis' ||
    unit === 'pence' ||
    unit === 'yen' ||
    unit === 'rappen' ||
    unit === 'ore' ||
    unit === 'paise' ||
    unit === 'centavos' ||
    unit === 'won'
  ) {
    return unit;
  }
  return 'cents';
}

export function BucketForm({
  mode,
  bucketId,
  initialValues,
  ownerOptions = [],
  editSection = 'general',
}: BucketFormProps) {
  const router = useRouter();
  const t = useTranslations('common.bucketForm');
  const apiBaseUrl = getManagementApiBaseUrl();

  const [name, setName] = useState(initialValues?.name ?? '');
  const [ownerId, setOwnerId] = useState('');
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? true);
  const [messageBodyMaxLength, setMessageBodyMaxLength] = useState(
    initialValues?.messageBodyMaxLength !== undefined
      ? String(initialValues.messageBodyMaxLength)
      : ''
  );
  const [preferredCurrency, setPreferredCurrency] = useState(
    initialValues?.preferredCurrency ?? 'USD'
  );
  const [publicBoostDisplayMinimumMinor, setPublicBoostDisplayMinimumMinor] = useState(
    initialValues?.publicBoostDisplayMinimumMinor !== undefined
      ? String(initialValues.publicBoostDisplayMinimumMinor)
      : '0'
  );
  const [nameTouched, setNameTouched] = useState(false);
  const [ownerTouched, setOwnerTouched] = useState(false);
  const [messageBodyMaxLengthTouched, setMessageBodyMaxLengthTouched] = useState(false);
  const [publicBoostDisplayMinimumMinorTouched, setPublicBoostDisplayMinimumMinorTouched] =
    useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApplyToDescendantsModal, setShowApplyToDescendantsModal] = useState(false);
  const [pendingEditBody, setPendingEditBody] =
    useState<managementWebBuckets.UpdateBucketBody | null>(null);
  const isNameEditable =
    mode !== 'edit' ||
    (initialValues?.bucketType !== 'rss-channel' && initialValues?.bucketType !== 'rss-item');

  const noUsersForCreate = mode === 'create' && ownerOptions.length === 0;

  const nameError = nameTouched && name.trim() === '' ? t('nameRequired') : null;
  const ownerError =
    mode === 'create' && ownerTouched && ownerId.trim() === '' && !noUsersForCreate
      ? t('ownerRequired')
      : null;

  const messageBodyMaxLengthParsed = parseInt(messageBodyMaxLength, 10);
  const messageBodyMaxLengthValid =
    Number.isInteger(messageBodyMaxLengthParsed) &&
    messageBodyMaxLengthParsed >= MIN_MESSAGE_BODY_MAX_LENGTH &&
    messageBodyMaxLengthParsed <= MAX_MESSAGE_BODY_MAX_LENGTH;
  const messageBodyMaxLengthError =
    mode === 'edit' && messageBodyMaxLengthTouched && !messageBodyMaxLengthValid
      ? t('messageBodyMaxLengthInvalid')
      : null;
  const publicBoostDisplayMinimumMinorParsed = parseInt(publicBoostDisplayMinimumMinor, 10);
  const publicBoostDisplayMinimumMinorValid =
    Number.isInteger(publicBoostDisplayMinimumMinorParsed) &&
    publicBoostDisplayMinimumMinorParsed >= MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR &&
    publicBoostDisplayMinimumMinorParsed <= MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR;
  const publicBoostDisplayMinimumMinorError =
    mode === 'edit' &&
    editSection === 'currency' &&
    publicBoostDisplayMinimumMinorTouched &&
    !publicBoostDisplayMinimumMinorValid
      ? t('publicBoostDisplayMinimumMinorInvalid')
      : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === 'create' || editSection === 'general') {
      setNameTouched(true);
    }
    if (mode === 'create') setOwnerTouched(true);
    if (
      (mode === 'create' || (mode === 'edit' && editSection === 'general')) &&
      isNameEditable &&
      name.trim() === ''
    ) {
      return;
    }
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
      if (
        bucketId === undefined ||
        (editSection === 'general' && !messageBodyMaxLengthValid) ||
        (editSection === 'currency' && !publicBoostDisplayMinimumMinorValid)
      ) {
        return;
      }
      setSubmitError(null);
      setLoading(true);
      try {
        const body: managementWebBuckets.UpdateBucketBody = {};
        if (editSection === 'general') {
          body.isPublic = isPublic;
          body.messageBodyMaxLength = messageBodyMaxLengthParsed;
        }
        if (editSection === 'currency') {
          body.preferredCurrency = preferredCurrency;
          body.publicBoostDisplayMinimumMinor = publicBoostDisplayMinimumMinorParsed;
        }
        if (isNameEditable && editSection === 'general') {
          body.name = name.trim();
        }
        const settingsChanged =
          (body.isPublic !== undefined && body.isPublic !== initialValues?.isPublic) ||
          (body.messageBodyMaxLength !== undefined &&
            body.messageBodyMaxLength !== initialValues?.messageBodyMaxLength) ||
          (body.preferredCurrency !== undefined &&
            body.preferredCurrency !== initialValues?.preferredCurrency) ||
          (body.publicBoostDisplayMinimumMinor !== undefined &&
            body.publicBoostDisplayMinimumMinor !== initialValues?.publicBoostDisplayMinimumMinor);
        if (settingsChanged) {
          const childrenRes = await managementWebBuckets.getChildBuckets(apiBaseUrl, bucketId);
          const hasChildren = childrenRes.ok && (childrenRes.data?.buckets.length ?? 0) > 0;
          if (hasChildren) {
            setPendingEditBody(body);
            setShowApplyToDescendantsModal(true);
            return;
          }
        }
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
        {(mode === 'create' || editSection === 'general') && (
          <Input
            label={t('name')}
            value={name}
            onChange={setName}
            onBlur={() => setNameTouched(true)}
            error={nameError}
            disabled={mode === 'edit' && !isNameEditable}
            autoComplete="off"
          />
        )}
        {mode === 'edit' && editSection === 'general' && !isNameEditable && (
          <Text size="sm" variant="muted">
            {t('derivedBucketNameNotice')}
          </Text>
        )}
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
        {(mode === 'create' || editSection === 'general') && (
          <Row>
            <CheckboxField label={t('isPublic')} checked={isPublic} onChange={setIsPublic} />
            <Tooltip content={t('publicTooltip')}>
              <InfoIcon size={18} />
            </Tooltip>
          </Row>
        )}
        {mode === 'edit' && editSection === 'general' && (
          <Input
            label={t('messageBodyMaxLength')}
            type="number"
            min={MIN_MESSAGE_BODY_MAX_LENGTH}
            max={MAX_MESSAGE_BODY_MAX_LENGTH}
            value={messageBodyMaxLength}
            onChange={setMessageBodyMaxLength}
            onBlur={() => setMessageBodyMaxLengthTouched(true)}
            error={messageBodyMaxLengthError ?? undefined}
            placeholder={t('messageBodyMaxLengthPlaceholder')}
            required
          />
        )}
        {mode === 'edit' && editSection === 'currency' && (
          <>
            <Select
              label={t('baselineCurrencyLabel')}
              options={SUPPORTED_CURRENCIES_ORDERED.map((currencyCode) => ({
                value: currencyCode,
                label: currencyCode,
              }))}
              value={preferredCurrency}
              onChange={(value) => setPreferredCurrency(value)}
            />
            <Input
              label={t('publicBoostDisplayMinimumMinor', {
                currency: preferredCurrency,
                unit: t(`currencyMinorUnits.${getMinorUnitI18nKey(preferredCurrency)}`),
              })}
              type="number"
              min={MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR}
              max={MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR}
              value={publicBoostDisplayMinimumMinor}
              onChange={setPublicBoostDisplayMinimumMinor}
              onBlur={() => setPublicBoostDisplayMinimumMinorTouched(true)}
              error={publicBoostDisplayMinimumMinorError ?? undefined}
              placeholder={t('publicBoostDisplayMinimumMinorPlaceholder')}
              required
            />
            <Text size="sm" variant="muted">
              {t('publicBoostDisplayMinimumMinorHelp', {
                brand_name: getManagementWebBrandName() ?? 'metaboost-management-web',
                currency: preferredCurrency,
                unit: t(`currencyMinorUnits.${getMinorUnitI18nKey(preferredCurrency)}`),
              })}
            </Text>
          </>
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
            disabled={
              noUsersForCreate ||
              (mode === 'edit' &&
                ((editSection === 'general' && !messageBodyMaxLengthValid) ||
                  (editSection === 'currency' && !publicBoostDisplayMinimumMinorValid)))
            }
          >
            {mode === 'create' ? t('createBucket') : t('saveChanges')}
          </Button>
        </FormActions>
      </Stack>
      {showApplyToDescendantsModal && pendingEditBody !== null && bucketId !== undefined ? (
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
                    const res = await managementWebBuckets.updateBucket(
                      apiBaseUrl,
                      bucketId,
                      pendingEditBody
                    );
                    if (!res.ok) {
                      setSubmitError(res.error.message ?? t('updateFailed'));
                      setLoading(false);
                      setShowApplyToDescendantsModal(false);
                      setPendingEditBody(null);
                      return;
                    }
                    setShowApplyToDescendantsModal(false);
                    setPendingEditBody(null);
                    setLoading(false);
                    router.push(bucketViewRoute(bucketId));
                    router.refresh();
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
                    const res = await managementWebBuckets.updateBucket(apiBaseUrl, bucketId, {
                      ...pendingEditBody,
                      applyToDescendants: true,
                    });
                    if (!res.ok) {
                      setSubmitError(res.error.message ?? t('updateFailed'));
                      setLoading(false);
                      setShowApplyToDescendantsModal(false);
                      setPendingEditBody(null);
                      return;
                    }
                    setShowApplyToDescendantsModal(false);
                    setPendingEditBody(null);
                    setLoading(false);
                    router.push(bucketViewRoute(bucketId));
                    router.refresh();
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
