'use client';

import type { FormLinkComponent } from '../../Form';

import { useTranslations } from 'next-intl';

import { isPasswordValid } from '@boilerplate/helpers';

import { Button } from '../../Button';
import { Form, FormLinks } from '../../Form';
import { Input } from '../../Input';
import { PasswordStrengthMeter } from '../../PasswordStrengthMeter';

export type ResetPasswordFormProps = {
  token: string;
  password: string;
  confirmPassword: string;
  onTokenChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  tokenError?: string | null;
  passwordError?: string | null;
  confirmError?: string | null;
  submitError?: string | null;
  loginHref: string;
  /** Optional override for the link component used in form links (defaults to Next.js Link). */
  LinkComponent?: FormLinkComponent;
};

export function ResetPasswordForm({
  token,
  password,
  confirmPassword,
  onTokenChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  loading,
  tokenError,
  passwordError,
  confirmError,
  submitError,
  loginHref,
  LinkComponent,
}: ResetPasswordFormProps) {
  const t = useTranslations('ui.auth.resetPassword');
  return (
    <Form title={t('title')} submitError={submitError} onSubmit={onSubmit}>
      <Input
        label={t('token')}
        type="text"
        value={token}
        onChange={onTokenChange}
        placeholder={t('tokenPlaceholder')}
        error={tokenError}
        disabled={loading}
      />
      <Input
        label={t('newPassword')}
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder={t('placeholderPassword')}
        error={passwordError}
        autoComplete="new-password"
        disabled={loading}
      />
      <PasswordStrengthMeter password={password} />
      <Input
        label={t('confirmPassword')}
        type="password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder={t('placeholderPassword')}
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
        {t('submit')}
      </Button>
      <FormLinks
        {...(LinkComponent !== undefined && { LinkComponent })}
        items={[{ href: loginHref, children: t('backToLogin') }]}
      />
    </Form>
  );
}
