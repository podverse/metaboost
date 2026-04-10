'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { AppTypeTitle, NavBar as UINavBar } from '@boilerplate/ui';

import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../lib/routes';

export function NavBar({ brandName }: { brandName: string }) {
  const t = useTranslations('common');
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.HOME);
  };

  const title = <AppTypeTitle brandName={brandName} />;

  return (
    <UINavBar
      title={title}
      homeHref={ROUTES.HOME}
      user={user}
      onLogout={handleLogout}
      navItems={[
        { href: ROUTES.BUCKETS, label: t('buckets') },
        { href: ROUTES.SETTINGS, label: t('settings') },
      ]}
      loginHref={ROUTES.LOGIN}
    />
  );
}
