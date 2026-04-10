'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { AppTypeTitle, NavBar as UINavBar } from '@boilerplate/ui';

import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../lib/routes';

export type NavBarMainNavItem = { href: string; label: string };

export function NavBar({
  brandName,
  mainNavItems,
}: {
  brandName: string;
  mainNavItems: NavBarMainNavItem[];
}) {
  const t = useTranslations('common');
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  const navItems = [...mainNavItems, { href: ROUTES.SETTINGS, label: t('settings') }];

  return (
    <UINavBar
      title={<AppTypeTitle brandName={brandName} />}
      homeHref={ROUTES.HOME}
      user={user}
      onLogout={handleLogout}
      navItems={navItems}
      loginHref={ROUTES.LOGIN}
    />
  );
}
