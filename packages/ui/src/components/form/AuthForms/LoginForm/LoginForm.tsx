'use client';

import type { FormLinkComponent } from '../../Form';

import { useTranslations } from 'next-intl';

import { Button } from '../../Button';
import { Form, FormLinks } from '../../Form';
import { Input } from '../../Input';

/** Web: one field for email or username. Management-web: username only. */
export type LoginIdentifierType = 'emailOrUsername' | 'usernameOnly';

export type LoginFormProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  emailError?: string | null;
  passwordError?: string | null;
  submitError?: string | null;
  /** Web: "Email or username". Management-web: "Username" only. Defaults to emailOrUsername. */
  identifierType?: LoginIdentifierType;
  /** When omitted, the sign-up link is not rendered. */
  signupHref?: string;
  /** When omitted, the forgot-password link is not rendered. */
  forgotPasswordHref?: string;
  /** Optional override for the link component used in form links (defaults to Next.js Link). */
  LinkComponent?: FormLinkComponent;
};

export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading,
  emailError,
  passwordError,
  submitError,
  identifierType = 'emailOrUsername',
  signupHref,
  forgotPasswordHref,
  LinkComponent,
}: LoginFormProps) {
  const t = useTranslations('ui.auth.login');
  const isUsernameOnly = identifierType === 'usernameOnly';
  const identifierLabel = isUsernameOnly ? t('username') : t('emailOrUsername');
  const identifierPlaceholder = isUsernameOnly
    ? t('placeholderUsername')
    : t('placeholderEmailOrUsername');
  const linkItems = [
    signupHref !== undefined ? { href: signupHref, children: t('signUp') } : null,
    forgotPasswordHref !== undefined
      ? { href: forgotPasswordHref, children: t('forgotPassword') }
      : null,
  ].filter((item): item is { href: string; children: string } => item !== null);
  return (
    <Form title={t('title')} submitError={submitError} onSubmit={onSubmit}>
      <Input
        label={identifierLabel}
        type="text"
        value={email}
        onChange={onEmailChange}
        placeholder={identifierPlaceholder}
        error={emailError}
        autoComplete="username"
        disabled={loading}
      />
      <Input
        label={t('password')}
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder={t('placeholderPassword')}
        error={passwordError}
        autoComplete="current-password"
        disabled={loading}
      />
      <Button type="submit" variant="primary" loading={loading}>
        {t('submit')}
      </Button>
      {linkItems.length > 0 && (
        <FormLinks {...(LinkComponent !== undefined && { LinkComponent })} items={linkItems} />
      )}
    </Form>
  );
}
