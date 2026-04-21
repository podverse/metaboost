import type { AccountSettingsTab } from '../../../lib/routes';

import { redirect } from 'next/navigation';

import { getAuthMode } from '../../../config/env';
import { getWebAuthModeCapabilities } from '../../../lib/authMode';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { SettingsPageContent } from './SettingsPageContent';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const resolvedSearch = searchParams !== undefined ? await searchParams : {};
  const tabParam = resolvedSearch.tab ?? 'general';

  const authCapabilities = getWebAuthModeCapabilities(getAuthMode());
  if (tabParam === 'email' && !authCapabilities.canUseEmailVerificationFlows) {
    redirect(ROUTES.SETTINGS);
  }

  const activeTab: AccountSettingsTab =
    tabParam === 'profile'
      ? 'profile'
      : tabParam === 'password'
        ? 'password'
        : tabParam === 'email'
          ? 'email'
          : tabParam === 'currency'
            ? 'currency'
            : tabParam === 'delete'
              ? 'delete'
              : 'general';

  return <SettingsPageContent initialUser={user} activeTab={activeTab} />;
}
