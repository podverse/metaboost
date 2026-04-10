'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AUTH_MESSAGE_LOGIN_FAILED } from '@boilerplate/helpers';
import { LoginForm, RateLimitModal } from '@boilerplate/ui';

import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../lib/routes';

export default function LoginPage() {
  const tErrors = useTranslations('errors');
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (user !== null) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.ok) {
      // Full-page navigation so the next request includes the session cookie (same-origin after login).
      window.location.href = ROUTES.DASHBOARD;
      return;
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
      <LoginForm
        email={username}
        password={password}
        onEmailChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        loading={loading}
        submitError={submitError}
        identifierType="usernameOnly"
      />
    </>
  );
}
