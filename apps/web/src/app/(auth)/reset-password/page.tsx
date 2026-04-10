'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { getRateLimitRetrySeconds, webAuth } from '@boilerplate/helpers-requests';
import {
  Container,
  LoadingSpinner,
  RateLimitModal,
  ResetPasswordForm,
  useAuthValidation,
} from '@boilerplate/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { getApiBaseUrl } from '../../../lib/api-client';
import { getWebAuthModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';

function ResetPasswordContent() {
  const locale = useLocale();
  const tErrors = useTranslations('errors');
  const tUi = useTranslations('ui');
  const { validatePassword } = useAuthValidation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get('token') ?? '';
  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    const tErr = token.trim() === '' ? tErrors('resetTokenRequired') : null;
    const pErr = validatePassword(password);
    const cErr =
      password !== confirmPassword
        ? tErrors('passwordsDoNotMatch')
        : validatePassword(confirmPassword, tUi('auth.resetPassword.confirmPassword'));
    setTokenError(tErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (tErr !== null || pErr !== null || cErr !== null) return;

    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const res = await webAuth.resetPassword(
      baseUrl,
      {
        token: token.trim(),
        newPassword: password,
      },
      { locale }
    );
    setLoading(false);

    if (res.ok) {
      router.push(ROUTES.LOGIN);
    } else if (res.status === 429) {
      setRateLimitRetrySeconds(
        getRateLimitRetrySeconds('auth:resetPassword', res.error?.retryAfterSeconds)
      );
      setShowRateLimitModal(true);
    } else {
      setSubmitError(res.error?.message ?? tErrors('resetFailed'));
    }
  };

  return (
    <>
      <RateLimitModal
        open={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        retryAfterSeconds={rateLimitRetrySeconds}
      />
      <ResetPasswordForm
        token={token}
        password={password}
        confirmPassword={confirmPassword}
        onTokenChange={setToken}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleSubmit}
        loading={loading}
        tokenError={tokenError}
        passwordError={passwordError}
        confirmError={confirmError}
        submitError={submitError}
        loginHref={ROUTES.LOGIN}
      />
    </>
  );
}

function ResetPasswordFallback() {
  return (
    <Container>
      <LoadingSpinner size="md" />
    </Container>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
