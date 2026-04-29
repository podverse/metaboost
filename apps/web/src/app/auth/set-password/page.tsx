'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { isPasswordValid, USERNAME_MAX_LENGTH } from '@metaboost/helpers';
import { getRateLimitRetrySeconds, webAuth } from '@metaboost/helpers-requests';
import {
  Button,
  Form,
  FormLinks,
  Input,
  PasswordStrengthMeter,
  RateLimitModal,
  useAuthValidation,
} from '@metaboost/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { getApiBaseUrl } from '../../../lib/api-client';
import { getWebAccountSignupModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';

export default function SetPasswordPage() {
  const locale = useLocale();
  const tErrors = useTranslations('errors');
  const tUi = useTranslations('ui');
  const tSignup = useTranslations('ui.auth.signup');
  const tReset = useTranslations('ui.auth.resetPassword');
  const { validateEmail, validatePassword } = useAuthValidation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get('token') ?? '';
  const runtimeConfig = getRuntimeConfig();
  const accountSignupModeCapabilities = getWebAccountSignupModeCapabilities(
    runtimeConfig.env.NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE
  );
  const requiresEmail = accountSignupModeCapabilities.requiresEmailAtInviteCompletion;
  const [token, setToken] = useState(tokenFromQuery);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!accountSignupModeCapabilities.canIssueAdminInviteLink) {
      router.replace(ROUTES.LOGIN);
    }
  }, [accountSignupModeCapabilities.canIssueAdminInviteLink, router]);

  function validateUsername(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed === '') return tSignup('usernameRequired');
    if (trimmed.length > USERNAME_MAX_LENGTH) {
      return tSignup('usernameMaxLength', { max: USERNAME_MAX_LENGTH });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return tSignup('usernameInvalidChars');
    }
    return null;
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const tokenValidationError = token.trim() === '' ? tErrors('resetTokenRequired') : null;
    const emailValidationError = requiresEmail ? validateEmail(email) : null;
    const usernameValidationError = validateUsername(username);
    const passwordValidationError = validatePassword(password);
    const confirmValidationError =
      password !== confirmPassword
        ? tErrors('passwordsDoNotMatch')
        : validatePassword(confirmPassword, tUi('auth.signup.confirmPassword'));
    setTokenError(tokenValidationError);
    setEmailError(emailValidationError);
    setUsernameError(usernameValidationError);
    setPasswordError(passwordValidationError);
    setConfirmError(confirmValidationError);
    if (
      tokenValidationError !== null ||
      emailValidationError !== null ||
      usernameValidationError !== null ||
      passwordValidationError !== null ||
      confirmValidationError !== null
    ) {
      return;
    }

    setLoading(true);
    const baseUrl = getApiBaseUrl();
    const res = await webAuth.setPassword(
      baseUrl,
      {
        token: token.trim(),
        newPassword: password,
        username: username.trim(),
        ...(requiresEmail ? { email: email.trim() } : {}),
      },
      { locale }
    );
    setLoading(false);

    if (res.ok) {
      router.push(ROUTES.LOGIN);
    } else if (res.status === 429) {
      setRateLimitRetrySeconds(
        getRateLimitRetrySeconds('auth:setPassword', res.error?.retryAfterSeconds)
      );
      setShowRateLimitModal(true);
    } else {
      setSubmitError(res.error?.message ?? tErrors('resetFailed'));
    }
  };

  if (!accountSignupModeCapabilities.canIssueAdminInviteLink) {
    return null;
  }

  return (
    <>
      <RateLimitModal
        open={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        retryAfterSeconds={rateLimitRetrySeconds}
      />
      <Form title={tReset('title')} submitError={submitError} onSubmit={handleSubmit}>
        <Input
          label={tReset('token')}
          type="text"
          value={token}
          onChange={setToken}
          placeholder={tReset('tokenPlaceholder')}
          error={tokenError}
          disabled={loading}
        />
        {requiresEmail && (
          <Input
            label={tSignup('email')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={tSignup('placeholderEmail')}
            error={emailError}
            autoComplete="email"
            disabled={loading}
          />
        )}
        <Input
          label={tSignup('username')}
          type="text"
          value={username}
          onChange={setUsername}
          placeholder={tSignup('placeholderUsername')}
          error={usernameError}
          autoComplete="username"
          disabled={loading}
        />
        <Input
          label={tReset('newPassword')}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={tReset('placeholderPassword')}
          error={passwordError}
          autoComplete="new-password"
          disabled={loading}
        />
        <PasswordStrengthMeter password={password} />
        <Input
          label={tReset('confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder={tReset('placeholderPassword')}
          error={confirmError}
          autoComplete="new-password"
          disabled={loading}
        />
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || !isPasswordValid(password)}
        >
          {tReset('submit')}
        </Button>
        <FormLinks items={[{ href: ROUTES.LOGIN, children: tReset('backToLogin') }]} />
      </Form>
    </>
  );
}
