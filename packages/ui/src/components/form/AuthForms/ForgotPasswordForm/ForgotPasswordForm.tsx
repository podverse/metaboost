'use client';

import type { FormLinkComponent } from '../../Form/index';

import { useTranslations } from 'next-intl';

import { SectionWithHeading } from '../../../layout/SectionWithHeading/index';
import { Text } from '../../../layout/Text/index';
import { Button } from '../../Button/index';
import { Form, FormLinks } from '../../Form/index';
import { Input } from '../../Input/index';

export type ForgotPasswordFormProps = {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  emailError?: string | null;
  submitError?: string | null;
  success: boolean;
  loginHref: string;
  /** Optional override for the link component used in form links (defaults to Next.js Link). */
  LinkComponent?: FormLinkComponent;
};

export function ForgotPasswordForm({
  email,
  onEmailChange,
  onSubmit,
  loading,
  emailError,
  submitError,
  success,
  loginHref,
  LinkComponent,
}: ForgotPasswordFormProps) {
  const t = useTranslations('ui.auth.forgotPassword');
  if (success) {
    return (
      <SectionWithHeading title={t('successTitle')}>
        <Text variant="success">{t('successMessage')}</Text>
        <FormLinks
          {...(LinkComponent !== undefined && { LinkComponent })}
          items={[{ href: loginHref, children: t('backToLogin') }]}
        />
      </SectionWithHeading>
    );
  }

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
      <Button type="submit" variant="primary" loading={loading}>
        {t('submit')}
      </Button>
      <FormLinks
        {...(LinkComponent !== undefined && { LinkComponent })}
        items={[{ href: loginHref, children: t('backToLogin') }]}
      />
    </Form>
  );
}
