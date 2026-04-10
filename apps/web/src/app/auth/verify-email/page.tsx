'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { getRateLimitRetrySeconds, webAuth } from '@boilerplate/helpers-requests';
import { CenterInViewport, Form, FormLinks, LoadingSpinner, RateLimitModal } from '@boilerplate/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { getApiBaseUrl } from '../../../lib/api-client';
import { getWebAuthModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';

function VerifyEmailContent() {
  const locale = useLocale();
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const tVerify = useTranslations('ui.auth.verifyEmail');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get('token') ?? '';
  const runtimeConfig = getRuntimeConfig();
  const authModeCapabilities = getWebAuthModeCapabilities(runtimeConfig.env.NEXT_PUBLIC_AUTH_MODE);
  const [loading, setLoading] = useState(!!tokenFromQuery.trim());
  const [message, setMessage] = useState<string | null>(null);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!authModeCapabilities.canUseEmailVerificationFlows) {
      router.replace(ROUTES.LOGIN);
    }
  }, [authModeCapabilities.canUseEmailVerificationFlows, router]);

  useEffect(() => {
    if (!authModeCapabilities.canUseEmailVerificationFlows) {
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
      const res = await webAuth.verifyEmail(baseUrl, { token }, { locale });
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setMessage(tVerify('success'));
        router.push(ROUTES.LOGIN);
      } else if (res.status === 429) {
        setRateLimitRetrySeconds(
          getRateLimitRetrySeconds('auth:verifyEmail', res.error?.retryAfterSeconds)
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
    authModeCapabilities.canUseEmailVerificationFlows,
    locale,
    tokenFromQuery,
    router,
    tErrors,
    tVerify,
  ]);

  if (!authModeCapabilities.canUseEmailVerificationFlows) {
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
        <Form title={tVerify('title')} submitError={message} onSubmit={(e) => e.preventDefault()}>
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

function VerifyEmailFallback() {
  return (
    <CenterInViewport contentMaxWidth="form" contentTextAlign="center">
      <LoadingSpinner size="md" />
    </CenterInViewport>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
