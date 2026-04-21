'use client';

import type { TermsVersionLifecycleStatus } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { managementWebTermsVersions } from '@metaboost/helpers-requests';
import { Button, FormActions, Stack, Text } from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';

export type TermsVersionActionsProps = {
  termsVersionId: string;
  status: TermsVersionLifecycleStatus;
  canEdit: boolean;
};

export function TermsVersionActions({ termsVersionId, status, canEdit }: TermsVersionActionsProps) {
  const tActions = useTranslations('common.termsVersionActions');
  const router = useRouter();
  const apiBaseUrl = getManagementApiBaseUrl();

  const [error, setError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const handleScheduleUpcoming = async () => {
    setScheduling(true);
    setError(null);
    try {
      const res = await managementWebTermsVersions.reqUpdateTermsVersion(
        apiBaseUrl,
        termsVersionId,
        {
          status: 'upcoming',
        }
      );
      if (!res.ok) {
        setError(res.error?.message ?? tActions('scheduleFailed'));
        return;
      }
      router.refresh();
    } finally {
      setScheduling(false);
    }
  };

  const handlePromoteToCurrent = async () => {
    setPromoting(true);
    setError(null);
    try {
      const res = await managementWebTermsVersions.reqPromoteTermsVersionToCurrent(
        apiBaseUrl,
        termsVersionId
      );
      if (!res.ok) {
        setError(res.error?.message ?? tActions('promoteFailed'));
        return;
      }
      router.refresh();
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Stack>
      {error !== null && (
        <Text variant="error" role="alert">
          {error}
        </Text>
      )}
      {canEdit && (status === 'draft' || status === 'upcoming') ? (
        <FormActions>
          {status === 'draft' ? (
            <Button
              type="button"
              variant="primary"
              loading={scheduling}
              onClick={handleScheduleUpcoming}
            >
              {tActions('scheduleUpcoming')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              loading={promoting}
              onClick={handlePromoteToCurrent}
            >
              {tActions('promoteToCurrent')}
            </Button>
          )}
        </FormActions>
      ) : null}
      {(status === 'current' || status === 'deprecated') && (
        <Text variant="muted">{tActions('immutableStatusHelp')}</Text>
      )}
      {status === 'upcoming' && <Text variant="muted">{tActions('promoteHelp')}</Text>}
    </Stack>
  );
}
