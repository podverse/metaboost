'use client';

import { useTranslations } from 'next-intl';

import { Dropdown } from '../Dropdown';
import { Link } from '../Link';

import styles from './NavBar.module.scss';

export type NavBarUser = {
  displayName: string | null;
  /** Optional; main app may use email, management app uses username only. */
  email?: string | null;
  /** Optional; management app uses username; display fallback is displayName ?? username ?? email. */
  username?: string | null;
};

export type NavBarLinkComponentProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
};

export type NavBarProps = {
  title: React.ReactNode;
  homeHref: string;
  user: NavBarUser | null;
  onLogout: () => void;
  navItems: { href: string; label: string }[];
  loginHref?: string;
  LinkComponent?: React.ComponentType<NavBarLinkComponentProps>;
};

export function NavBar({
  title,
  homeHref,
  user,
  onLogout,
  navItems,
  loginHref,
  LinkComponent = Link,
}: NavBarProps) {
  const t = useTranslations('ui.header');
  const items = [
    ...navItems.map((item) => ({ type: 'link' as const, href: item.href, label: item.label })),
    { type: 'button' as const, label: t('logout'), onClick: onLogout },
  ];

  return (
    <header className={styles.navBar}>
      <LinkComponent href={homeHref} className={styles.brandWrapper}>
        <span className={styles.brand}>{title}</span>
      </LinkComponent>
      <div className={styles.actions}>
        {user !== null ? (
          <Dropdown
            aria-label={t('userMenuAria')}
            LinkComponent={LinkComponent}
            items={items}
            trigger={
              <>
                <i className="fa-solid fa-user" aria-hidden />
                <span className={styles.userLabel}>
                  {user.displayName ?? user.username ?? user.email ?? '—'}
                </span>
                <i className={`${styles.chevron} fa-solid fa-chevron-down`} aria-hidden />
              </>
            }
          />
        ) : loginHref !== undefined ? (
          <LinkComponent href={loginHref}>
            <span className={styles.loginLink}>{t('logIn')}</span>
          </LinkComponent>
        ) : null}
      </div>
    </header>
  );
}
