'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Link, Tabs } from '@metaboost/ui';

import { userEditRoute } from '../../../../../lib/routes';

export function EditUserTabs({
  userId,
  activeTab,
}: {
  userId: string;
  activeTab: 'profile' | 'password';
}) {
  const pathname = usePathname();
  const t = useTranslations('common.userForm');

  const profileHref = userEditRoute(userId);
  const passwordHref = userEditRoute(userId, 'password');
  const tabItems = [
    { href: profileHref, label: t('profileTab') },
    { href: passwordHref, label: t('changePassword') },
  ];
  const currentHref = activeTab === 'password' ? passwordHref : profileHref;

  return (
    <Tabs
      items={tabItems}
      LinkComponent={Link}
      activeHref={pathname !== null && pathname !== undefined ? currentHref : profileHref}
      exactMatch
    />
  );
}
