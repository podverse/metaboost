'use client';

import type { AccountSettingsTab } from '../../../lib/routes';
import type { ServerUser } from '../../../lib/server-auth';
import type { TabItem } from '@metaboost/ui';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import { ALL_AVAILABLE_LOCALES, type Locale } from '@metaboost/helpers';
import { SUPPORTED_CURRENCIES_ORDERED } from '@metaboost/helpers-currency';
import { webAuth } from '@metaboost/helpers-requests';
import {
  ContentPageLayout,
  FormContainer,
  SectionWithHeading,
  Stack,
  Input,
  Button,
  PasswordStrengthMeter,
  Text,
  Link,
  Tabs,
  Select,
  ThemeSelector,
  setSettingsCookie,
} from '@metaboost/ui';

import { getRuntimeConfig } from '../../../config/runtime-config-store';
import { useAuth } from '../../../context/AuthContext';
import { getApiBaseUrl } from '../../../lib/api-client';
import { getWebAuthModeCapabilities } from '../../../lib/authMode';
import { accountSettingsRoute } from '../../../lib/routes';

function parseUserFromResponse(data: unknown): {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  preferredCurrency: string | null;
} | null {
  if (data === undefined || typeof data !== 'object' || data === null) return null;
  if (!('user' in data) || typeof (data as { user: unknown }).user !== 'object') return null;
  const u = (
    data as {
      user: {
        id?: string;
        email?: string | null;
        username?: string | null;
        displayName?: string | null;
        preferredCurrency?: string | null;
      };
    }
  ).user;
  if (typeof u.id !== 'string') return null;
  const hasEmail = u.email !== undefined && u.email !== null && u.email !== '';
  const hasUsername = u.username !== undefined && u.username !== null && u.username !== '';
  if (!hasEmail && !hasUsername) return null;
  return {
    id: u.id,
    email: hasEmail ? (u.email as string) : null,
    username: hasUsername ? (u.username as string) : null,
    displayName: u.displayName ?? null,
    preferredCurrency: u.preferredCurrency ?? null,
  };
}

export type SettingsPageContentProps = {
  initialUser: ServerUser;
  activeTab: AccountSettingsTab;
};

export function SettingsPageContent({ initialUser, activeTab }: SettingsPageContentProps) {
  const t = useTranslations('profile');
  const tSettings = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, setSession } = useAuth();
  const u = user ?? initialUser;
  const [displayName, setDisplayName] = useState(u.displayName ?? '');
  const [username, setUsername] = useState(u.username ?? '');
  const [usernameBlurError, setUsernameBlurError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState(u.preferredCurrency ?? 'USD');
  const [preferredCurrencySaving, setPreferredCurrencySaving] = useState(false);
  const [preferredCurrencyMessage, setPreferredCurrencyMessage] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailChangeSaving, setEmailChangeSaving] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState<string | null>(null);

  const authCapabilities = getWebAuthModeCapabilities(getRuntimeConfig().env.NEXT_PUBLIC_AUTH_MODE);
  const showEmailTab = authCapabilities.canUseEmailVerificationFlows;

  const tabParam = searchParams.get('tab');
  const currentHref =
    pathname !== null && pathname !== undefined
      ? `${pathname}${tabParam !== null && tabParam !== '' ? `?tab=${tabParam}` : ''}`
      : accountSettingsRoute(activeTab);

  const tabItems: TabItem[] = [
    { href: accountSettingsRoute(), label: tSettings('generalTab') },
    { href: accountSettingsRoute('profile'), label: tSettings('profileTab') },
    { href: accountSettingsRoute('currency'), label: tSettings('currencyTab') },
    { href: accountSettingsRoute('password'), label: tSettings('passwordTab') },
    ...(showEmailTab
      ? [{ href: accountSettingsRoute('email'), label: tSettings('emailTab') }]
      : []),
  ];

  const localeOptions = ALL_AVAILABLE_LOCALES.map((loc: Locale) => ({
    value: loc,
    label: tSettings(`languages.${loc}`),
  }));
  const currencyOptions = SUPPORTED_CURRENCIES_ORDERED.map((currency) => ({
    value: currency,
    label: currency,
  }));

  const handleUsernameBlur = useCallback(async () => {
    const value = username.trim();
    if (value === '') {
      setUsernameBlurError(null);
      return;
    }
    setUsernameBlurError(null);
    const baseUrl = getApiBaseUrl();
    const res = await webAuth.usernameAvailable(baseUrl, value);
    if (res.ok && res.data !== undefined && res.data.available === false) {
      setUsernameBlurError(t('usernameNotAvailable'));
    }
  }, [username, t]);

  const handleUpdateProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setProfileMessage(null);
      setUsernameBlurError(null);
      setProfileSaving(true);
      try {
        const baseUrl = getApiBaseUrl();
        const res = await webAuth.updateProfile(baseUrl, {
          displayName: displayName.trim() === '' ? null : displayName.trim(),
          username: username.trim() === '' ? null : username.trim(),
        });
        if (res.ok && res.data !== undefined) {
          const updated = parseUserFromResponse(res.data);
          if (updated !== null) {
            setSession({
              id: updated.id,
              email: updated.email,
              username: updated.username,
              displayName: updated.displayName,
              preferredCurrency: updated.preferredCurrency,
            });
            setProfileMessage(t('profileUpdated'));
          }
        } else {
          const msg = res.error?.message ?? t('errors.requestFailed');
          setProfileMessage(
            res.status === 409 && msg.toLowerCase().includes('username')
              ? t('usernameNotAvailable')
              : msg
          );
        }
      } catch {
        setProfileMessage(t('errors.requestFailed'));
      } finally {
        setProfileSaving(false);
      }
    },
    [displayName, username, setSession, t]
  );

  const handleConfirmNewPasswordBlur = useCallback(() => {
    if (newPassword !== confirmNewPassword && confirmNewPassword !== '') {
      setPasswordMatchError(t('errors.passwordsDoNotMatch'));
    } else {
      setPasswordMatchError(null);
    }
  }, [newPassword, confirmNewPassword, t]);

  const handleUpdatePreferredCurrency = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPreferredCurrencyMessage(null);
      setPreferredCurrencySaving(true);
      try {
        const baseUrl = getApiBaseUrl();
        const res = await webAuth.updateProfile(baseUrl, {
          preferredCurrency: preferredCurrency.trim() === '' ? null : preferredCurrency.trim(),
        });
        if (res.ok && res.data !== undefined) {
          const updated = parseUserFromResponse(res.data);
          if (updated !== null) {
            setSession({
              id: updated.id,
              email: updated.email,
              username: updated.username,
              displayName: updated.displayName,
              preferredCurrency: updated.preferredCurrency,
            });
          }
          setPreferredCurrencyMessage(tSettings('baselineCurrencySaved'));
        } else {
          setPreferredCurrencyMessage(res.error?.message ?? t('errors.requestFailed'));
        }
      } catch {
        setPreferredCurrencyMessage(t('errors.requestFailed'));
      } finally {
        setPreferredCurrencySaving(false);
      }
    },
    [preferredCurrency, setSession, t, tSettings]
  );

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordMessage(null);
      setPasswordMatchError(null);
      if (newPassword !== confirmNewPassword) {
        setPasswordMessage(t('errors.passwordsDoNotMatch'));
        return;
      }
      setPasswordSaving(true);
      try {
        const baseUrl = getApiBaseUrl();
        const res = await webAuth.changePassword(
          baseUrl,
          { currentPassword, newPassword },
          { locale }
        );
        if (res.ok) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          setPasswordMessage(t('passwordChanged'));
        } else {
          setPasswordMessage(res.error?.message ?? t('errors.requestFailed'));
        }
      } catch {
        setPasswordMessage(t('errors.requestFailed'));
      } finally {
        setPasswordSaving(false);
      }
    },
    [currentPassword, newPassword, confirmNewPassword, locale, t]
  );

  const handleRequestEmailChange = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEmailChangeMessage(null);
      setEmailChangeSaving(true);
      try {
        const baseUrl = getApiBaseUrl();
        const res = await webAuth.requestEmailChange(
          baseUrl,
          { newEmail: newEmail.trim() },
          { locale }
        );
        if (res.ok) {
          setNewEmail('');
          setEmailChangeMessage(t('emailChangeRequested'));
        } else {
          setEmailChangeMessage(res.error?.message ?? t('errors.requestFailed'));
        }
      } catch {
        setEmailChangeMessage(t('errors.requestFailed'));
      } finally {
        setEmailChangeSaving(false);
      }
    },
    [newEmail, locale, t]
  );

  return (
    <ContentPageLayout
      title={tSettings('title')}
      contentMaxWidth="form"
      constrainMainOnly
      fullWidthAboveConstrained={
        <Tabs items={tabItems} LinkComponent={Link} activeHref={currentHref} exactMatch />
      }
    >
      {activeTab === 'general' && (
        <SectionWithHeading title={tSettings('preferences')}>
          <FormContainer onSubmit={(e) => e.preventDefault()}>
            <ThemeSelector label={tSettings('theme')} />
            <Select
              label={tSettings('languages.language')}
              options={localeOptions}
              value={locale}
              onChange={(value) => {
                setSettingsCookie('web-settings', { locale: value });
                router.refresh();
              }}
            />
          </FormContainer>
        </SectionWithHeading>
      )}
      {activeTab === 'profile' && (
        <Stack>
          <FormContainer onSubmit={handleUpdateProfile}>
            <Input
              label={t('displayName')}
              type="text"
              value={displayName}
              onChange={(value) => setDisplayName(value)}
              placeholder={t('displayNamePlaceholder')}
              disabled={profileSaving}
              autoComplete="name"
            />
            <Input
              label={t('username')}
              type="text"
              value={username}
              onChange={(value) => setUsername(value)}
              onBlur={() => void handleUsernameBlur()}
              error={usernameBlurError}
              disabled={profileSaving}
              autoComplete="username"
            />
            <Input
              label={t('email')}
              type="email"
              value={u.email ?? ''}
              onChange={() => {}}
              disabled
              autoComplete="email"
            />
            {profileMessage !== null && (
              <Text
                size="sm"
                variant={profileMessage === t('profileUpdated') ? 'success' : 'error'}
              >
                {profileMessage}
              </Text>
            )}
            <Button type="submit" disabled={profileSaving} loading={profileSaving}>
              {t('updateProfile')}
            </Button>
          </FormContainer>
        </Stack>
      )}
      {activeTab === 'currency' && (
        <SectionWithHeading title={tSettings('currencyTab')}>
          <FormContainer onSubmit={handleUpdatePreferredCurrency}>
            <Select
              label={tSettings('baselineCurrencyLabel')}
              options={currencyOptions}
              value={preferredCurrency}
              onChange={(value) => setPreferredCurrency(value.toUpperCase())}
              disabled={preferredCurrencySaving}
            />
            {preferredCurrencyMessage !== null && (
              <Text
                size="sm"
                variant={
                  preferredCurrencyMessage === tSettings('baselineCurrencySaved')
                    ? 'success'
                    : 'error'
                }
              >
                {preferredCurrencyMessage}
              </Text>
            )}
            <Button
              type="submit"
              disabled={preferredCurrencySaving}
              loading={preferredCurrencySaving}
            >
              {tSettings('savePreferences')}
            </Button>
          </FormContainer>
        </SectionWithHeading>
      )}
      {activeTab === 'password' && (
        <Stack>
          <FormContainer onSubmit={handleChangePassword}>
            <Input
              label={t('currentPassword')}
              type="password"
              value={currentPassword}
              onChange={(value) => setCurrentPassword(value)}
              placeholder={t('placeholderPassword')}
              disabled={passwordSaving}
              autoComplete="current-password"
            />
            <Input
              label={t('newPassword')}
              type="password"
              value={newPassword}
              onChange={(value) => {
                setNewPassword(value);
                setPasswordMatchError(null);
              }}
              placeholder={t('placeholderPassword')}
              disabled={passwordSaving}
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={newPassword} />
            <Input
              label={t('confirmNewPassword')}
              type="password"
              value={confirmNewPassword}
              onChange={(value) => {
                setConfirmNewPassword(value);
                setPasswordMatchError(null);
              }}
              onBlur={handleConfirmNewPasswordBlur}
              error={passwordMatchError}
              placeholder={t('placeholderPassword')}
              disabled={passwordSaving}
              autoComplete="new-password"
            />
            {passwordMessage !== null && (
              <Text
                size="sm"
                variant={passwordMessage === t('passwordChanged') ? 'success' : 'error'}
              >
                {passwordMessage}
              </Text>
            )}
            <Button
              type="submit"
              disabled={
                passwordSaving ||
                currentPassword.trim() === '' ||
                newPassword === '' ||
                confirmNewPassword === '' ||
                newPassword !== confirmNewPassword
              }
              loading={passwordSaving}
            >
              {t('changePasswordSubmit')}
            </Button>
          </FormContainer>
        </Stack>
      )}
      {showEmailTab && activeTab === 'email' && (
        <Stack>
          <FormContainer onSubmit={handleRequestEmailChange}>
            <Input
              label={t('newEmail')}
              type="email"
              value={newEmail}
              onChange={(value) => setNewEmail(value)}
              placeholder="new@example.com"
              disabled={emailChangeSaving}
              autoComplete="email"
            />
            {emailChangeMessage !== null && (
              <Text
                size="sm"
                variant={emailChangeMessage === t('emailChangeRequested') ? 'success' : 'error'}
              >
                {emailChangeMessage}
              </Text>
            )}
            <Button type="submit" disabled={emailChangeSaving} loading={emailChangeSaving}>
              {t('requestEmailChangeSubmit')}
            </Button>
          </FormContainer>
        </Stack>
      )}
    </ContentPageLayout>
  );
}
