'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEffect } from 'react';

import { getRateLimitRetrySeconds, webAuth } from '@boilerplate/helpers-requests';
import { ForgotPasswordForm, RateLimitModal, useAuthValidation } from '@boilerplate/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { getApiBaseUrl } from '../../../lib/api-client';
import { getWebAuthModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const { validateEmail } = useAuthValidation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);
  const runtimeConfig = getRuntimeConfig();
  const authModeCapabilities = getWebAuthModeCapabilities(runtimeConfig.env.NEXT_PUBLIC_AUTH_MODE);

  useEffect(() => {
    if (!authModeCapabilities.canUseEmailVerificationFlows) {
      router.replace(ROUTES.LOGIN);
    }
  }, [authModeCapabilities.canUseEmailVerificationFlows, router]);

  if (!authModeCapabilities.canUseEmailVerificationFlows) {
    return null;
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const eErr = validateEmail(email);
    setEmailError(eErr);
    if (eErr !== null) return;

    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const res = await webAuth.forgotPassword(baseUrl, email, { locale });
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else if (res.status === 429) {
      setRateLimitRetrySeconds(
        getRateLimitRetrySeconds('auth:forgotPassword', res.error?.retryAfterSeconds)
      );
      setShowRateLimitModal(true);
    } else {
      setSubmitError(res.error?.message ?? tErrors('requestFailed'));
    }
  };

  return (
    <>
      <RateLimitModal
        open={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        retryAfterSeconds={rateLimitRetrySeconds}
      />
      <ForgotPasswordForm
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleSubmit}
        loading={loading}
        emailError={emailError}
        submitError={submitError}
        success={success}
        loginHref={ROUTES.LOGIN}
      />
    </>
  );
}
