import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container, NavCardGrid, Text } from '@metaboost/ui';

import { getVisibleNavEntries } from '../../../lib/main-nav';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';

export default async function DashboardPage() {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const tDashboard = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');
  const displayName = user.displayName ?? user.username;

  const getDescriptionByLabelKey = (labelKey: string) => {
    if (labelKey === 'admins') return tDashboard('links.admins.description');
    if (labelKey === 'globalBlockedApps') return tDashboard('links.globalBlockedApps.description');
    if (labelKey === 'events') return tDashboard('links.events.description');
    if (labelKey === 'termsVersions') return tDashboard('links.termsVersions.description');
    if (labelKey === 'users') return tDashboard('links.users.description');
    if (labelKey === 'buckets') return tDashboard('links.buckets.description');
    return '';
  };

  const cards = getVisibleNavEntries(user.isSuperAdmin, user.permissions)
    .filter((entry) => entry.href !== ROUTES.DASHBOARD)
    .map((entry) => ({
      href: entry.href,
      title: tCommon(entry.labelKey),
      description: getDescriptionByLabelKey(entry.labelKey),
    }));

  return (
    <Container>
      <h1>{tDashboard('title')}</h1>
      <Text>{tDashboard('hello', { name: displayName })}</Text>
      <NavCardGrid cards={cards} LinkComponent={Link} />
    </Container>
  );
}
