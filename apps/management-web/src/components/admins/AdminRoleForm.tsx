'use client';

import type { EventVisibility } from '@metaboost/helpers-requests';
import type { CrudFlags } from '@metaboost/ui';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { bitmaskToFlags, flagsToBitmask, safeReturnPathOrFallback } from '@metaboost/helpers';
import { managementWebAdminRoles } from '@metaboost/helpers-requests';
import {
  Button,
  CrudCheckboxes,
  FormActions,
  FormContainer,
  Input,
  Select,
  Stack,
  Text,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';

export function AdminRoleForm({
  returnUrl,
  cancelUrl,
  fallbackNavigationHref,
}: {
  returnUrl: string;
  cancelUrl: string;
  fallbackNavigationHref: string;
}) {
  const router = useRouter();
  const t = useTranslations('common.adminForm');
  const [name, setName] = useState('');
  const [adminsFlags, setAdminsFlags] = useState<CrudFlags>(bitmaskToFlags(0));
  const [usersFlags, setUsersFlags] = useState<CrudFlags>(bitmaskToFlags(0));
  const [bucketsFlags, setBucketsFlags] = useState<CrudFlags>(bitmaskToFlags(15));
  const [bucketMessagesFlags, setBucketMessagesFlags] = useState<CrudFlags>(bitmaskToFlags(15));
  const [bucketAdminsFlags, setBucketAdminsFlags] = useState<CrudFlags>(bitmaskToFlags(15));
  const [eventVisibility, setEventVisibility] = useState<EventVisibility>('all_admins');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedReturnUrl = safeReturnPathOrFallback(returnUrl, fallbackNavigationHref);
  const resolvedCancelUrl = safeReturnPathOrFallback(cancelUrl, fallbackNavigationHref);

  const crudLabels = {
    create: t('crudCreate'),
    read: t('crudRead'),
    update: t('crudUpdate'),
    delete: t('crudDelete'),
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name.trim() === '') return;
    setLoading(true);
    setError(null);
    const res = await managementWebAdminRoles.createManagementAdminRole(getManagementApiBaseUrl(), {
      name: name.trim(),
      adminsCrud: flagsToBitmask(adminsFlags),
      usersCrud: flagsToBitmask(usersFlags),
      bucketsCrud: flagsToBitmask(bucketsFlags),
      bucketMessagesCrud: flagsToBitmask(bucketMessagesFlags),
      bucketAdminsCrud: flagsToBitmask(bucketAdminsFlags),
      eventVisibility,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message ?? t('createFailed'));
      return;
    }
    router.push(resolvedReturnUrl);
    router.refresh();
  };

  return (
    <FormContainer onSubmit={(e) => void handleSubmit(e)}>
      <Stack>
        <Input label={t('roleName')} value={name} onChange={setName} autoComplete="off" />
        <CrudCheckboxes
          label={t('adminsCrud')}
          labels={crudLabels}
          flags={adminsFlags}
          onChange={setAdminsFlags}
        />
        <CrudCheckboxes
          label={t('usersCrud')}
          labels={crudLabels}
          flags={usersFlags}
          onChange={setUsersFlags}
        />
        <CrudCheckboxes
          label={t('bucketsCrud')}
          labels={crudLabels}
          flags={bucketsFlags}
          onChange={setBucketsFlags}
        />
        <CrudCheckboxes
          label={t('bucketAdminsCrud')}
          labels={crudLabels}
          flags={bucketAdminsFlags}
          onChange={setBucketAdminsFlags}
        />
        <CrudCheckboxes
          label={t('bucketMessagesCrud')}
          labels={crudLabels}
          flags={bucketMessagesFlags}
          onChange={setBucketMessagesFlags}
        />
        <Select
          label={t('eventVisibility')}
          value={eventVisibility}
          onChange={(value) => setEventVisibility(value as EventVisibility)}
          options={[
            { value: 'own', label: t('eventVisibilityOwn') },
            { value: 'all_admins', label: t('eventVisibilityAllAdmins') },
            { value: 'all', label: t('eventVisibilityAll') },
          ]}
        />
        {error !== null && (
          <Text variant="error" role="alert">
            {error}
          </Text>
        )}
        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(resolvedCancelUrl)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {t('createRole')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
