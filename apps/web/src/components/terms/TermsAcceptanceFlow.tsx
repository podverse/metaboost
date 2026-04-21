'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { logoutThenReplace } from '@metaboost/helpers';
import { webAuth } from '@metaboost/helpers-requests';
import {
  Button,
  CheckboxField,
  ConfirmDeleteModal,
  FormContainer,
  SectionWithHeading,
  Stack,
  Text,
} from '@metaboost/ui';

import { TermsVersionCard } from '../TermsVersionCard';
import { mapAuthPayloadToUser, useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../lib/api-client';
import { parseAuthEnvelope, type AuthTermsVersionPayload } from '../../lib/auth-user';
import { ROUTES } from '../../lib/routes';

import styles from './TermsAcceptanceFlow.module.scss';

export type TermsAcceptanceFlowProps = {
  /** Terms body shown above the acceptance controls (e.g. upcoming only, or upcoming fallback to current on the gate page). */
  terms: AuthTermsVersionPayload | null;
};

export function TermsAcceptanceFlow({ terms }: TermsAcceptanceFlowProps) {
  const t = useTranslations('termsGate');
  const tErrors = useTranslations('errors');
  const { user, hydrate, logout, setSession } = useAuth();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (user?.displayName !== null && user?.displayName !== undefined && user.displayName !== '') {
      return user.displayName;
    }
    if (user?.username !== null && user?.username !== undefined && user.username !== '') {
      return user.username;
    }
    if (user?.email !== null && user?.email !== undefined && user.email !== '') {
      return user.email;
    }
    return t('deleteFallbackName');
  }, [t, user?.displayName, user?.email, user?.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!agreed) {
      setSubmitError(t('mustAgree'));
      return;
    }

    setSaving(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await webAuth.acceptLatestTerms(baseUrl, { agreeToTerms: true });
      if (!response.ok) {
        setSubmitError(response.error?.message ?? tErrors('requestFailed'));
        return;
      }

      const parsed = parseAuthEnvelope(response.data);
      if (parsed !== null) {
        setSession(mapAuthPayloadToUser(parsed));
      } else {
        await hydrate();
      }
      window.location.assign(ROUTES.DASHBOARD);
    } catch {
      setSubmitError(tErrors('requestFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    const baseUrl = getApiBaseUrl();
    const response = await webAuth.deleteMe(baseUrl);
    if (!response.ok) {
      setDeleteError(response.error?.message ?? tErrors('requestFailed'));
      setDeleteLoading(false);
      return;
    }

    setDeleteLoading(false);
    setConfirmDeleteOpen(false);
    await logoutThenReplace(logout, router.replace, ROUTES.LOGIN);
  };

  return (
    <>
      <Stack>
        {terms !== null ? <TermsVersionCard terms={terms} /> : null}
        <FormContainer onSubmit={handleSubmit}>
          <Stack>
            <CheckboxField
              label={t('agreeLabel')}
              checked={agreed}
              onChange={setAgreed}
              disabled={saving}
            />
            {submitError !== null && <Text variant="error">{submitError}</Text>}
            <Button type="submit" loading={saving} disabled={saving || !agreed}>
              {t('continueButton')}
            </Button>
          </Stack>
        </FormContainer>

        <SectionWithHeading title={t('moreOptionsTitle')}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMoreOpen((value) => !value)}
            disabled={saving || deleteLoading}
          >
            {moreOpen ? t('moreOptionsCollapse') : t('moreOptionsExpand')}
          </Button>
          {moreOpen && (
            <Stack className={styles.moreOptionsContent}>
              <Text size="sm">{t('deleteDescription')}</Text>
              {deleteError !== null && <Text variant="error">{deleteError}</Text>}
              <Button
                type="button"
                variant="danger"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={saving || deleteLoading}
              >
                {t('deleteButton')}
              </Button>
            </Stack>
          )}
        </SectionWithHeading>
      </Stack>

      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        displayName={displayName}
        translationKeyPrefix="common.confirmDeleteUser"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          void handleDeleteAccount();
        }}
        confirmLoading={deleteLoading}
      />
    </>
  );
}
