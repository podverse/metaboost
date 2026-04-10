'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { USERNAME_MAX_LENGTH } from '@boilerplate/helpers';
import { getRateLimitRetrySeconds, webAuth } from '@boilerplate/helpers-requests';
import { RateLimitModal, SignupForm, useAuthValidation } from '@boilerplate/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { useAuth } from '../../../context/AuthContext';
import { getApiBaseUrl } from '../../../lib/api-client';
import { getWebAuthModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';

export default function SignupPage() {
  const locale = useLocale();
  const tErrors = useTranslations('errors');
  const tUi = useTranslations('ui');
  const tSignup = useTranslations('ui.auth.signup');
  const { validateEmail, validatePassword } = useAuthValidation();
  const { setSession } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);
  const runtimeConfig = getRuntimeConfig();
  const authModeCapabilities = getWebAuthModeCapabilities(runtimeConfig.env.NEXT_PUBLIC_AUTH_MODE);

  useEffect(() => {
    if (!authModeCapabilities.canPublicSignup) {
      router.replace(ROUTES.LOGIN);
    }
  }, [authModeCapabilities.canPublicSignup, router]);

  if (!authModeCapabilities.canPublicSignup) {
    return null;
  }

  function validateUsername(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed === '') return tSignup('usernameRequired');
    if (trimmed.length > USERNAME_MAX_LENGTH) {
      return tSignup('usernameMaxLength', { max: USERNAME_MAX_LENGTH });
    }
    return null;
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const eErr = validateEmail(email);
    const uErr = validateUsername(username);
    const pErr = validatePassword(password);
    const cErr =
      password !== confirmPassword
        ? tErrors('passwordsDoNotMatch')
        : validatePassword(confirmPassword, tUi('auth.signup.confirmPassword'));
    setEmailError(eErr);
    setUsernameError(uErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (eErr !== null || uErr !== null || pErr !== null || cErr !== null) return;

    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const res = await webAuth.signup(
      baseUrl,
      {
        email,
        username: username.trim(),
        password,
        displayName: displayName.trim() === '' ? null : displayName.trim(),
      },
      { locale }
    );
    setLoading(false);

    if (
      res.ok &&
      res.data !== undefined &&
      typeof res.data === 'object' &&
      res.data !== null &&
      'user' in res.data
    ) {
      const data = res.data as {
        user: {
          id: string;
          email?: string | null;
          username?: string | null;
          displayName?: string | null;
        };
      };
      const u = data.user;
      setSession({
        id: u.id,
        email: u.email ?? null,
        username: u.username ?? null,
        displayName: u.displayName ?? null,
      });
      router.push(ROUTES.DASHBOARD);
    } else if (res.ok) {
      router.push(`${ROUTES.LOGIN}?checkEmail=1`);
    } else if (res.status === 429) {
      setRateLimitRetrySeconds(
        getRateLimitRetrySeconds('auth:signup', res.error?.retryAfterSeconds)
      );
      setShowRateLimitModal(true);
    } else {
      const msg = res.error?.message ?? tErrors('signupFailed');
      setSubmitError(
        res.status === 409 && msg.toLowerCase().includes('username')
          ? tSignup('usernameAlreadyInUse')
          : msg
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
      <SignupForm
        email={email}
        username={username}
        password={password}
        confirmPassword={confirmPassword}
        displayName={displayName}
        onEmailChange={setEmail}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onDisplayNameChange={setDisplayName}
        onSubmit={handleSubmit}
        loading={loading}
        emailError={emailError}
        usernameError={usernameError}
        passwordError={passwordError}
        confirmError={confirmError}
        submitError={submitError}
        loginHref={ROUTES.LOGIN}
      />
    </>
  );
}
