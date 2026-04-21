'use client';

import type { UserFormInitialValues } from '../../../../../components/users/UserForm';

import { UserForm } from '../../../../../components/users/UserForm';

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
  return (
    <UserForm mode="edit" userId={userId} initialValues={initialValues} activeEditTab={activeTab} />
  );
}
