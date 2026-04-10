'use client';

import type { UserFormInitialValues } from '../../../../../components/users/UserForm';
import type { TabItem } from '@metaboost/ui';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Link, Tabs } from '@metaboost/ui';

import { UserForm } from '../../../../../components/users/UserForm';
import { userEditRoute } from '../../../../../lib/routes';

export type EditUserPageContentProps = {
  userId: string;
  initialValues: UserFormInitialValues;
  activeTab: 'profile' | 'password';
};

export function EditUserPageContent({
  userId,
  initialValues,
  activeTab,
}: EditUserPageContentProps) {
  const pathname = usePathname();
  const t = useTranslations('common.userForm');

  const profileHref = userEditRoute(userId);
  const passwordHref = userEditRoute(userId, 'password');
  const tabItems: TabItem[] = [
    { href: profileHref, label: t('profileTab') },
    { href: passwordHref, label: t('changePassword') },
  ];
  const currentHref = activeTab === 'password' ? passwordHref : profileHref;

  return (
    <>
      <Tabs
        items={tabItems}
        LinkComponent={Link}
        activeHref={pathname !== null && pathname !== undefined ? currentHref : profileHref}
        exactMatch
      />
      <UserForm
        mode="edit"
        userId={userId}
        initialValues={initialValues}
        activeEditTab={activeTab}
      />
    </>
  );
}
