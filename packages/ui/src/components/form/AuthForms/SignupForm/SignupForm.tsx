'use client';

import type { FormLinkComponent } from '../../Form';

import { useTranslations } from 'next-intl';

import { isPasswordValid } from '@boilerplate/helpers';

import { Button } from '../../Button';
import { Form, FormLinks } from '../../Form';
import { Input } from '../../Input';
import { PasswordStrengthMeter } from '../../PasswordStrengthMeter';

export type SignupFormProps = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  onEmailChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  emailError?: string | null;
  usernameError?: string | null;
  passwordError?: string | null;
  confirmError?: string | null;
  submitError?: string | null;
  loginHref: string;
  /** Optional override for the link component used in form links (defaults to Next.js Link). */
  LinkComponent?: FormLinkComponent;
};

export function SignupForm({
  email,
  username,
  password,
  confirmPassword,
  displayName,
  onEmailChange,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onDisplayNameChange,
  onSubmit,
  loading,
  emailError,
  usernameError,
  passwordError,
  confirmError,
  submitError,
  loginHref,
  LinkComponent,
}: SignupFormProps) {
  const t = useTranslations('ui.auth.signup');
  return (
    <Form title={t('title')} submitError={submitError} onSubmit={onSubmit}>
      <Input
        label={t('email')}
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder={t('placeholderEmail')}
        error={emailError}
        autoComplete="email"
        disabled={loading}
      />
      <Input
        label={t('username')}
        type="text"
        value={username}
        onChange={onUsernameChange}
        placeholder={t('placeholderUsername')}
        error={usernameError}
        autoComplete="username"
        disabled={loading}
      />
      <Input
        label={t('displayName')}
        type="text"
        value={displayName}
        onChange={onDisplayNameChange}
        placeholder={t('placeholderDisplayName')}
        autoComplete="name"
        disabled={loading}
      />
      <Input
        label={t('password')}
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
        items={[{ href: loginHref, children: t('logIn') }]}
        prefix={t('prefix')}
      />
    </Form>
  );
}
