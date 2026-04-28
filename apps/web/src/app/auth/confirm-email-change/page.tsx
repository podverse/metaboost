'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getRateLimitRetrySeconds, webAuth } from '@metaboost/helpers-requests';
import { CenterInViewport, Form, FormLinks, LoadingSpinner, RateLimitModal } from '@metaboost/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { getApiBaseUrl } from '../../../lib/api-client';
import { getWebAccountSignupModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';

function ConfirmEmailChangeContent() {
  const locale = useLocale();
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const tConfirm = useTranslations('ui.auth.confirmEmailChange');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get('token') ?? '';
  const runtimeConfig = getRuntimeConfig();
  const accountSignupModeCapabilities = getWebAccountSignupModeCapabilities(
    runtimeConfig.env.NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE
  );
  const [loading, setLoading] = useState(!!tokenFromQuery.trim());
  const [message, setMessage] = useState<string | null>(null);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
      router.replace(ROUTES.LOGIN);
    }
  }, [accountSignupModeCapabilities.canUseEmailVerificationFlows, router]);

  useEffect(() => {
    if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
      return;
    }
    const token = tokenFromQuery.trim();
    if (token === '') {
      setLoading(false);
      setMessage(tErrors('invalidOrExpiredLink'));
      return;
    }
    let cancelled = false;
    (async () => {
      const baseUrl = getApiBaseUrl();
      const res = await webAuth.confirmEmailChange(baseUrl, { token }, { locale });
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setMessage(tConfirm('success'));
        router.push(ROUTES.SETTINGS);
      } else if (res.status === 429) {
        setRateLimitRetrySeconds(
          getRateLimitRetrySeconds('auth:confirmEmailChange', res.error?.retryAfterSeconds)
        );
        setShowRateLimitModal(true);
      } else {
        setMessage(res.error?.message ?? tErrors('invalidOrExpiredLink'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    accountSignupModeCapabilities.canUseEmailVerificationFlows,
    locale,
    tokenFromQuery,
    router,
    tErrors,
    tConfirm,
  ]);

  if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
    return null;
  }

  if (loading) {
    return (
      <CenterInViewport contentMaxWidth="form" contentTextAlign="center">
        <LoadingSpinner size="md" />
      </CenterInViewport>
    );
  }

  return (
    <>
      <RateLimitModal
        open={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        retryAfterSeconds={rateLimitRetrySeconds}
      />
      <CenterInViewport contentMaxWidth="form" contentTextAlign="center">
        <Form title={tConfirm('title')} submitError={message} onSubmit={(e) => e.preventDefault()}>
          <FormLinks
            items={[
              { href: ROUTES.HOME, children: tCommon('dashboard') },
              { href: ROUTES.LOGIN, children: tCommon('backToLogin') },
            ]}
          />
        </Form>
      </CenterInViewport>
    </>
  );
}

export default function ConfirmEmailChangePage() {
  return <ConfirmEmailChangeContent />;
}
