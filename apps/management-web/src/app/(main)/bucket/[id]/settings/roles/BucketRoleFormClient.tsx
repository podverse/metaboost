'use client';

import type { CrudFlags } from '@metaboost/ui';

import { useState } from 'react';

import { CRUD_BITS, bitmaskToFlags, flagsToBitmask } from '@metaboost/helpers';
import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';
import {
  Button,
  ButtonLink,
  CrudCheckboxes,
  FormActions,
  FormContainer,
  Input,
  Stack,
  Text,
} from '@metaboost/ui';

export type BucketRoleFormClientProps = {
  mode: 'create' | 'edit';
  bucketId: string;
  roleId?: string;
  initialName: string;
  initialBucketCrud: number;
  initialMessageCrud: number;
  initialAdminCrud: number;
  labels: {
    roleName: string;
    bucketPermissions: string;
    bucketPermissionsInfo?: string;
    bucketMessagesPermissions: string;
    adminPermissionsLabel: string;
    crudCreate: string;
    crudRead: string;
    crudUpdate: string;
    crudDelete: string;
    save: string;
    cancel: string;
  };
  submitRoleAction: (payload: {
    name: string;
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
  }) => Promise<void>;
  successHref: string;
  cancelHref: string;
};

export function BucketRoleFormClient({
  mode: _mode,
  initialName,
  initialBucketCrud,
  initialMessageCrud,
  initialAdminCrud,
  labels,
  submitRoleAction,
  successHref,
  cancelHref,
}: BucketRoleFormClientProps) {
  const crudLabels: Record<'create' | 'read' | 'update' | 'delete', string> = {
    create: labels.crudCreate,
    read: labels.crudRead,
    update: labels.crudUpdate,
    delete: labels.crudDelete,
  };
  const [name, setName] = useState(initialName);
  const [bucketFlags, setBucketFlags] = useState<CrudFlags>(() => ({
    ...bitmaskToFlags(initialBucketCrud),
    read: true,
  }));
  const [messageFlags, setMessageFlags] = useState<CrudFlags>(() => ({
    ...bitmaskToFlags(initialMessageCrud),
    read: true,
  }));
  const [adminFlags, setAdminFlags] = useState<CrudFlags>({
    ...bitmaskToFlags(initialAdminCrud),
    read: true,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAdminFlagsWithReadForced = (next: CrudFlags) => {
    setAdminFlags({ ...next, read: true });
  };
  const setBucketFlagsWithReadForced = (next: CrudFlags) => {
    const withRead = next.create || next.update || next.delete ? { ...next, read: true } : next;
    setBucketFlags(withRead);
    setMessageFlags((prev) => ({
      ...prev,
      create: prev.create || withRead.create,
      read: true,
      update: prev.update || withRead.update,
      delete: prev.delete || withRead.delete,
    }));
  };
  const setMessageFlagsWithReadForced = (next: CrudFlags) => {
    setMessageFlags({
      ...next,
      read: true,
      create: next.create || bucketFlags.create,
      update: next.update || bucketFlags.update,
      delete: next.delete || bucketFlags.delete,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed === '') {
      setSubmitError('Role name is required');
      return;
    }
    setSubmitError(null);
    setLoading(true);
    try {
      const bucketCrud = flagsToBitmask(bucketFlags) | CRUD_BITS.read;
      const bucketMessagesCrud = flagsToBitmask(messageFlags) | CRUD_BITS.read | bucketCrud;
      await submitRoleAction({
        name: trimmed,
        bucketCrud,
        bucketMessagesCrud,
        bucketAdminsCrud: flagsToBitmask(adminFlags) | CRUD_BITS.read,
      });
      window.location.href = successHref;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Stack>
        <Input
          label={labels.roleName}
          value={name}
          onChange={setName}
          maxLength={SHORT_TEXT_MAX_LENGTH}
          required
          autoComplete="off"
        />
        <CrudCheckboxes
          label={labels.adminPermissionsLabel}
          labels={crudLabels}
          flags={adminFlags}
          onChange={setAdminFlagsWithReadForced}
          disabledBits={{ read: true }}
        />
        <CrudCheckboxes
          label={labels.bucketPermissions}
          labels={crudLabels}
          flags={bucketFlags}
          onChange={setBucketFlagsWithReadForced}
          disabledBits={{ read: true }}
          selectAllInfo={labels.bucketPermissionsInfo}
        />
        <CrudCheckboxes
          label={labels.bucketMessagesPermissions}
          labels={crudLabels}
          flags={messageFlags}
          onChange={setMessageFlagsWithReadForced}
          disabledBits={{
            read: true,
            create: bucketFlags.create,
            update: bucketFlags.update,
            delete: bucketFlags.delete,
          }}
        />
        {submitError !== null && (
          <Text variant="error" size="sm" as="p" role="alert">
            {submitError}
          </Text>
        )}
        <FormActions>
          <ButtonLink href={cancelHref} variant="secondary">
            {labels.cancel}
          </ButtonLink>
          <Button type="submit" variant="primary" loading={loading}>
            {labels.save}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
