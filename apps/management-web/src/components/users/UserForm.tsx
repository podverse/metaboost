'use client';

import type { CreateUserBody, ManagementBucket } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { validatePassword } from '@metaboost/helpers';
import { managementWebBuckets, managementWebUsers } from '@metaboost/helpers-requests';
import {
  Button,
  CheckboxField,
  CopyButton,
  FormActions,
  FormContainer,
  FormSection,
  Input,
  PasswordStrengthMeter,
  Stack,
  Text,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { ROUTES } from '../../lib/routes';

export type UserFormInitialValues = {
  email: string;
  displayName: string;
};

export type UserFormProps = {
  mode: 'create' | 'edit';
  userId?: string;
  initialValues?: UserFormInitialValues;
  /** When set in edit mode, only the profile section or only the change-password section is rendered (for tabbed layout). */
  activeEditTab?: 'profile' | 'password';
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function UserForm({ mode, userId, initialValues, activeEditTab }: UserFormProps) {
  const router = useRouter();
  const t = useTranslations('common.userForm');
  const apiBaseUrl = getManagementApiBaseUrl();

  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(initialValues?.displayName ?? '');

  const [initialBucketAdminIds, setInitialBucketAdminIds] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<ManagementBucket[]>([]);
  const [createdSetPasswordLink, setCreatedSetPasswordLink] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');

  const [emailTouched, setEmailTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'create') return;
    let cancelled = false;
    (async () => {
      const res = await managementWebBuckets.listBuckets(apiBaseUrl, { limit: 500 });
      if (cancelled || !res.ok || res.data === undefined) return;
      setBuckets(res.data.buckets);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, apiBaseUrl]);

  const passwordValidation =
    mode === 'create' || password !== ''
      ? validatePassword(password, {
          required: t('passwordRequired'),
          minLength: (min) => t('passwordMinLength', { count: min }),
          maxLength: (max) => t('passwordMaxLength', { count: max }),
          requirements: t('passwordInsecure'),
        })
      : { valid: true as const };

  const newPasswordValidation =
    newPassword !== ''
      ? validatePassword(newPassword, {
          required: t('passwordRequired'),
          minLength: (min) => t('passwordMinLength', { count: min }),
          maxLength: (max) => t('passwordMaxLength', { count: max }),
          requirements: t('passwordInsecure'),
        })
      : { valid: true as const };

  const hasEmail = email.trim() !== '' && isValidEmail(email.trim());
  const hasUsername = username.trim() !== '';
  const atLeastOneIdentifier = hasEmail || hasUsername;

  const emailError =
    emailTouched && email.trim() !== ''
      ? !isValidEmail(email.trim())
        ? t('emailInvalid')
        : null
      : null;

  const usernameError =
    (emailTouched || usernameTouched) && !atLeastOneIdentifier
      ? t('emailOrUsernameRequired')
      : null;

  const passwordError =
    passwordTouched && mode === 'create'
      ? passwordValidation.valid
        ? null
        : passwordValidation.message
      : null;

  const newPasswordError =
    newPasswordTouched && newPassword !== ''
      ? newPasswordValidation.valid
        ? null
        : newPasswordValidation.message
      : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailTouched(true);
    setUsernameTouched(true);
    setPasswordTouched(true);
    if (mode === 'create') {
      if (!atLeastOneIdentifier) return;
      if (emailError !== null) return;
      if (password.trim() !== '' && !passwordValidation.valid) return;
      setSubmitError(null);
      setLoading(true);
      try {
        const body: CreateUserBody = {
          ...(hasEmail ? { email: email.trim() } : {}),
          ...(hasUsername ? { username: username.trim() } : {}),
          ...(password.trim() !== '' ? { password } : {}),
          displayName: displayName.trim() === '' ? null : displayName.trim(),
          initialBucketAdminIds:
            initialBucketAdminIds.length > 0 ? initialBucketAdminIds : undefined,
        };
        const res = await managementWebUsers.createUser(apiBaseUrl, body);
        if (!res.ok) {
          setSubmitError(res.error.message ?? t('createFailed'));
          return;
        }
        if (res.data?.setPasswordLink !== undefined) {
          setCreatedSetPasswordLink(res.data.setPasswordLink);
        } else {
          router.push(ROUTES.USERS);
          router.refresh();
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    if (email.trim() === '' || !isValidEmail(email.trim())) return;
    if (userId === undefined) return;
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await managementWebUsers.updateUser(apiBaseUrl, userId, {
        email: email.trim(),
        displayName: displayName.trim() === '' ? null : displayName.trim(),
      });
      if (!res.ok) {
        setSubmitError(res.error.message ?? t('updateFailed'));
        return;
      }
      router.push(ROUTES.USERS);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setNewPasswordTouched(true);
    if (newPassword === '' || !newPasswordValidation.valid || userId === undefined) return;
    setChangePasswordError(null);
    setChangePasswordLoading(true);
    try {
      const res = await managementWebUsers.changeUserPassword(apiBaseUrl, userId, {
        newPassword,
      });
      if (!res.ok) {
        setChangePasswordError(res.error.message ?? t('changePasswordFailed'));
        return;
      }
      setNewPassword('');
      setNewPasswordTouched(false);
      setChangePasswordError(null);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (createdSetPasswordLink !== null) {
    return (
      <Stack>
        <Text>{t('userCreatedWithLink')}</Text>
        <Stack>
          <Input
            label={t('setPasswordLinkLabel')}
            value={createdSetPasswordLink}
            onChange={() => {}}
            readOnly
            autoComplete="off"
          />
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => router.push(ROUTES.USERS)}>
              {t('backToList')}
            </Button>
            <CopyButton
              variant="primary"
              value={createdSetPasswordLink}
              copyLabel={t('copyLink')}
              copiedLabel={t('linkCopied')}
            />
          </FormActions>
        </Stack>
      </Stack>
    );
  }

  return (
    <FormContainer
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <Stack>
        {mode === 'create' && (
          <>
            <Input
              label={t('emailOptional')}
              type="email"
              value={email}
              onChange={setEmail}
              onBlur={() => setEmailTouched(true)}
              error={emailError}
              autoComplete="off"
            />
            <Input
              label={t('usernameOptional')}
              value={username}
              onChange={setUsername}
              onBlur={() => setUsernameTouched(true)}
              error={usernameError}
              autoComplete="off"
            />
            <Text variant="muted">{t('emailOrUsernameHint')}</Text>
            <Input
              label={t('passwordOptional')}
              type="password"
              value={password}
              onChange={setPassword}
              onBlur={() => setPasswordTouched(true)}
              error={passwordError}
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={password} />
            <Input
              label={t('displayNameOptional')}
              value={displayName}
              onChange={setDisplayName}
              autoComplete="off"
            />
            {buckets.length > 0 && (
              <FormSection title={t('initialBucketAdmins')}>
                <Stack>
                  {buckets.map((b) => (
                    <CheckboxField
                      key={b.id}
                      label={`${b.name} (${b.shortId})`}
                      checked={initialBucketAdminIds.includes(b.id)}
                      onChange={(checked) =>
                        setInitialBucketAdminIds((prev) =>
                          checked ? [...prev, b.id] : prev.filter((id) => id !== b.id)
                        )
                      }
                    />
                  ))}
                </Stack>
              </FormSection>
            )}
          </>
        )}
        {mode === 'edit' && (activeEditTab === undefined || activeEditTab === 'profile') && (
          <>
            <Input
              label={t('email')}
              type="email"
              value={email}
              onChange={setEmail}
              onBlur={() => setEmailTouched(true)}
              error={emailError}
              autoComplete="off"
            />
            <Input
              label={t('displayNameOptional')}
              value={displayName}
              onChange={setDisplayName}
              autoComplete="off"
            />
          </>
        )}

        {submitError !== null && (activeEditTab === undefined || activeEditTab === 'profile') && (
          <Text variant="error" role="alert">
            {submitError}
          </Text>
        )}

        {(activeEditTab === undefined || activeEditTab === 'profile') && (
          <FormActions>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(ROUTES.USERS)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {mode === 'create' ? t('createUser') : t('saveChanges')}
            </Button>
          </FormActions>
        )}

        {mode === 'edit' &&
          userId !== undefined &&
          (activeEditTab === undefined || activeEditTab === 'password') &&
          (activeEditTab === 'password' ? (
            <Stack>
              <Input
                label={t('newPassword')}
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                onBlur={() => setNewPasswordTouched(true)}
                error={newPasswordError}
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={newPassword} />
              {changePasswordError !== null && (
                <Text variant="error" role="alert">
                  {changePasswordError}
                </Text>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={handleChangePassword}
                loading={changePasswordLoading}
                disabled={newPassword === '' || !newPasswordValidation.valid}
              >
                {t('changePasswordButton')}
              </Button>
            </Stack>
          ) : (
            <FormSection title={t('changePassword')}>
              <Input
                label={t('newPassword')}
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                onBlur={() => setNewPasswordTouched(true)}
                error={newPasswordError}
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={newPassword} />
              {changePasswordError !== null && (
                <Text variant="error" role="alert">
                  {changePasswordError}
                </Text>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={handleChangePassword}
                loading={changePasswordLoading}
                disabled={newPassword === '' || !newPasswordValidation.valid}
              >
                {t('changePasswordButton')}
              </Button>
            </FormSection>
          ))}
      </Stack>
    </FormContainer>
  );
}
