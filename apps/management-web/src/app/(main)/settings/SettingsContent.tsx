'use client';

import type { AccountSettingsTab } from '../../../lib/routes';
import type { ServerUser } from '../../../lib/server-auth';
import type { TabItem } from '@boilerplate/ui';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';

import { ALL_AVAILABLE_LOCALES, type Locale } from '@boilerplate/helpers';
import { managementWebAuth } from '@boilerplate/helpers-requests';
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
} from '@boilerplate/ui';

import { useAuth } from '../../../context/AuthContext';
import { getApiBaseUrl } from '../../../lib/api-client';
import { accountSettingsRoute } from '../../../lib/routes';

function parseUserFromResponse(
  data: unknown
): { id: string; username: string; displayName: string | null } | null {
  if (data === undefined || typeof data !== 'object' || data === null) return null;
  if (!('user' in data) || typeof (data as { user: unknown }).user !== 'object') return null;
  const u = (data as { user: { id?: string; username?: string; displayName?: string | null } })
    .user;
  if (typeof u.id !== 'string' || typeof u.username !== 'string') return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName ?? null,
  };
}

export type SettingsContentProps = {
  settingsCookieName: string;
  initialUser: ServerUser;
  activeTab: AccountSettingsTab;
};

/**
 * Management-web settings content. Tabbed layout aligned with web app (General, Profile, Password).
 * No email tab: management has no mailer and admins use username only.
 */
export function SettingsContent({
  settingsCookieName,
  initialUser,
  activeTab,
}: SettingsContentProps) {
  const t = useTranslations('profile');
  const tSettings = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, setSession } = useAuth();
  const u = user ?? initialUser;

  const [displayName, setDisplayName] = useState(u.displayName ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const tabParam = searchParams.get('tab');
  const currentHref =
    pathname !== null && pathname !== undefined
      ? `${pathname}${tabParam !== null && tabParam !== '' ? `?tab=${tabParam}` : ''}`
      : accountSettingsRoute(activeTab);

  const tabItems: TabItem[] = [
    { href: accountSettingsRoute(), label: tSettings('generalTab') },
    { href: accountSettingsRoute('profile'), label: tSettings('profileTab') },
    { href: accountSettingsRoute('password'), label: tSettings('passwordTab') },
  ];

  const localeOptions = ALL_AVAILABLE_LOCALES.map((loc: Locale) => ({
    value: loc,
    label: tSettings(`languages.${loc}`),
  }));

  const handleUpdateProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setProfileMessage(null);
      const trimmed = displayName.trim();
      if (trimmed === '') {
        setProfileMessage(t('errors.requestFailed'));
        return;
      }
      setProfileSaving(true);
      try {
        const baseUrl = getApiBaseUrl();
        const res = await managementWebAuth.updateProfile(baseUrl, { displayName: trimmed });
        if (res.ok && res.data !== undefined) {
          const updated = parseUserFromResponse(res.data);
          if (updated !== null) {
            setSession(updated);
            setProfileMessage(t('profileUpdated'));
          }
        } else {
          setProfileMessage(res.error?.message ?? t('errors.requestFailed'));
        }
      } catch {
        setProfileMessage(t('errors.requestFailed'));
      } finally {
        setProfileSaving(false);
      }
    },
    [displayName, setSession, t]
  );

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordMessage(null);
      if (newPassword !== confirmNewPassword) {
        setPasswordMessage(t('errors.passwordsDoNotMatch'));
        return;
      }
      setPasswordSaving(true);
      try {
        const baseUrl = getApiBaseUrl();
        const res = await managementWebAuth.changePassword(
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

  return (
    <ContentPageLayout title={tSettings('title')} contentMaxWidth="form">
      <Tabs items={tabItems} LinkComponent={Link} activeHref={currentHref} exactMatch />
      {activeTab === 'general' && (
        <SectionWithHeading title={tSettings('preferences')}>
          <FormContainer onSubmit={(e) => e.preventDefault()}>
            <ThemeSelector label={tSettings('theme')} />
            <Select
              label={tSettings('languages.language')}
              options={localeOptions}
              value={locale}
              onChange={(value) => {
                setSettingsCookie(settingsCookieName, { locale: value });
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
              label={t('username')}
              type="text"
              value={u.username}
              onChange={() => {}}
              disabled
              autoComplete="username"
            />
            <Input
              label={t('displayName')}
              type="text"
              value={displayName}
              onChange={(value) => setDisplayName(value)}
              placeholder={t('displayNamePlaceholder')}
              disabled={profileSaving}
              autoComplete="name"
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
              onChange={(value) => setNewPassword(value)}
              placeholder={t('placeholderPassword')}
              disabled={passwordSaving}
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={newPassword} />
            <Input
              label={t('confirmNewPassword')}
              type="password"
              value={confirmNewPassword}
              onChange={(value) => setConfirmNewPassword(value)}
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
            <Button type="submit" disabled={passwordSaving} loading={passwordSaving}>
              {t('changePasswordSubmit')}
            </Button>
          </FormContainer>
        </Stack>
      )}
    </ContentPageLayout>
  );
}
