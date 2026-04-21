'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  AUTH_MESSAGE_LOGIN_FAILED,
  isSafeLoginReturnUrl,
  isTruthyQueryFlag,
} from '@metaboost/helpers';
import { LoginForm, RateLimitModal, Text } from '@metaboost/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { useAuth } from '../../../context/AuthContext';
import { getWebAuthModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';

import styles from './page.module.scss';

export default function LoginPage() {
  const tErrors = useTranslations('errors');
  const tAuth = useTranslations('auth');
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const showCheckEmailMessage = isTruthyQueryFlag(searchParams.get('checkEmail'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);
  const runtimeConfig = getRuntimeConfig();
  const authModeCapabilities = getWebAuthModeCapabilities(runtimeConfig.env.NEXT_PUBLIC_AUTH_MODE);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      const target =
        returnUrl !== null && isSafeLoginReturnUrl(returnUrl, [ROUTES.LOGIN, ROUTES.SIGNUP])
          ? returnUrl
          : ROUTES.DASHBOARD;
      router.push(target);
    } else if (result.rateLimit !== undefined) {
      setRateLimitRetrySeconds(result.rateLimit.retryAfterSeconds);
      setShowRateLimitModal(true);
    } else {
      setSubmitError(
        result.message === AUTH_MESSAGE_LOGIN_FAILED ? tErrors('loginFailed') : result.message
      );
    }
  };

  return (
    <>
      <RateLimitModal
        open={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        retryAfterSeconds={rateLimitRetrySeconds}
      />
      {showCheckEmailMessage && (
        <Text variant="success" className={styles.successMessage}>
          {tAuth('checkEmailVerification')}
        </Text>
      )}
      <LoginForm
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        loading={loading}
        submitError={submitError}
        signupHref={authModeCapabilities.canPublicSignup ? ROUTES.SIGNUP : undefined}
        forgotPasswordHref={
          authModeCapabilities.canUseEmailVerificationFlows ? ROUTES.FORGOT_PASSWORD : undefined
        }
      />
    </>
  );
}
