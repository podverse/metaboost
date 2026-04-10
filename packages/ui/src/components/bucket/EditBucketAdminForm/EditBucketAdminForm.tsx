'use client';

import type { CrudFlags } from '../../form/CrudCheckboxes/CrudCheckboxes';
import type { BucketAdminRoleOption } from '../BucketAdminsView/BucketAdminsView';

import { useEffect, useMemo, useState } from 'react';

import { CRUD_BITS, bitmaskToFlags, flagsToBitmask } from '@metaboost/helpers';

import { Button } from '../../form/Button/Button';
import { ButtonLink } from '../../form/ButtonLink/ButtonLink';
import { CrudCheckboxes } from '../../form/CrudCheckboxes/CrudCheckboxes';
import { FormActions } from '../../form/FormActions/FormActions';
import { FormContainer } from '../../form/FormContainer/FormContainer';
import { Select } from '../../form/Select/Select';
import { Stack } from '../../layout/Stack/Stack';
import { Text } from '../../layout/Text/Text';

export const EDIT_ADMIN_CUSTOM_ROLE_ID = '__custom__';
export const EDIT_ADMIN_CREATE_ROLE_ID = '__create_role__';

export type EditBucketAdminFormLabels = {
  save: string;
  cancel: string;
  /** When using role dropdown (roleOptions.length > 0). */
  roleSelectLabel?: string;
  customRoleLabel?: string;
  createRoleOptionLabel?: string;
  /** When using CRUD checkboxes (roleOptions empty). */
  bucketPermissions?: string;
  bucketPermissionsInfo?: string;
  bucketMessagesPermissions?: string;
  adminPermissionsLabel?: string;
  crudCreate?: string;
  crudRead?: string;
  crudUpdate?: string;
  crudDelete?: string;
};

export type EditBucketAdminFormPayload = {
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
};

export type EditBucketAdminFormProps = {
  initialBucketCrud: number;
  initialMessageCrud: number;
  initialAdminCrud: number;
  /** When empty, form shows CRUD checkboxes (legacy). When non-empty, form shows role dropdown. */
  roleOptions?: BucketAdminRoleOption[];
  createNewRoleHref?: string;
  labels: EditBucketAdminFormLabels;
  onSubmit: (payload: EditBucketAdminFormPayload) => void | Promise<void>;
  successHref: string;
  cancelHref: string;
  /** If provided, called after successful submit instead of navigating via successHref (e.g. router.push). */
  onSuccess?: () => void;
  /** When true, all form controls are disabled and the save button is hidden. Use for viewing the bucket owner. */
  readOnly?: boolean;
};

function bucketAdminsCrudWithRead(crud: number): number {
  return crud | CRUD_BITS.read;
}

function rolePermissionScore(role: BucketAdminRoleOption): number {
  return (
    role.bucketCrud + role.bucketMessagesCrud + bucketAdminsCrudWithRead(role.bucketAdminsCrud)
  );
}

export function EditBucketAdminForm({
  initialBucketCrud,
  initialMessageCrud,
  initialAdminCrud,
  roleOptions = [],
  createNewRoleHref,
  labels,
  onSubmit,
  successHref,
  cancelHref,
  onSuccess,
  readOnly = false,
}: EditBucketAdminFormProps) {
  const useRoleDropdown = roleOptions.length > 0;
  const crudLabels: Record<'create' | 'read' | 'update' | 'delete', string> = {
    create: labels.crudCreate ?? 'Create',
    read: labels.crudRead ?? 'Read',
    update: labels.crudUpdate ?? 'Update',
    delete: labels.crudDelete ?? 'Delete',
  };
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
  const setAdminFlagsWithReadForced = (next: CrudFlags) => {
    setAdminFlags({ ...next, read: true });
  };
  const setBucketFlagsWithReadForced = (next: CrudFlags) => {
    setBucketFlags(next);
    setMessageFlags((prev) => ({
      ...prev,
      create: prev.create || next.create,
      read: true,
      update: prev.update || next.update,
      delete: prev.delete || next.delete,
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

  const initialAdminCrudNorm = bucketAdminsCrudWithRead(initialAdminCrud);
  const highestRole =
    roleOptions.length > 0
      ? roleOptions.reduce((best, role) =>
          rolePermissionScore(role) > rolePermissionScore(best) ? role : best
        )
      : null;
  const { options, customOption, selectedId } = useMemo(() => {
    const opts = roleOptions.map((r) => ({ value: r.id, label: r.label }));
    if (createNewRoleHref !== undefined && createNewRoleHref !== '') {
      opts.push({
        value: EDIT_ADMIN_CREATE_ROLE_ID,
        label: labels.createRoleOptionLabel ?? 'Custom Role',
      });
    }
    if (highestRole !== null) {
      return { options: opts, customOption: null, selectedId: highestRole.id };
    }
    const customLabel = labels.customRoleLabel ?? 'Custom (no matching role)';
    return {
      options: [{ value: EDIT_ADMIN_CUSTOM_ROLE_ID, label: customLabel }, ...opts],
      customOption: {
        id: EDIT_ADMIN_CUSTOM_ROLE_ID,
        label: customLabel,
        bucketCrud: initialBucketCrud,
        bucketMessagesCrud: initialMessageCrud,
        bucketAdminsCrud: initialAdminCrudNorm,
      },
      selectedId: EDIT_ADMIN_CUSTOM_ROLE_ID,
    };
  }, [
    roleOptions,
    initialBucketCrud,
    initialMessageCrud,
    initialAdminCrudNorm,
    highestRole,
    labels.customRoleLabel,
    labels.createRoleOptionLabel,
    createNewRoleHref,
  ]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>(selectedId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedRole = roleOptions.find((r) => r.id === selectedRoleId);
  const isInvalidRoleSelection =
    useRoleDropdown &&
    selectedRoleId !== EDIT_ADMIN_CUSTOM_ROLE_ID &&
    selectedRoleId !== EDIT_ADMIN_CREATE_ROLE_ID &&
    selectedRole === undefined;
  const selectedRoleDescription =
    selectedRoleId === EDIT_ADMIN_CUSTOM_ROLE_ID || selectedRoleId === EDIT_ADMIN_CREATE_ROLE_ID
      ? null
      : (selectedRole?.description ?? null);

  useEffect(() => {
    if (!useRoleDropdown) return;
    if (selectedRoleId === EDIT_ADMIN_CUSTOM_ROLE_ID && customOption !== null) {
      setBucketFlags({ ...bitmaskToFlags(customOption.bucketCrud), read: true });
      setMessageFlags({ ...bitmaskToFlags(customOption.bucketMessagesCrud), read: true });
      setAdminFlags(bitmaskToFlags(customOption.bucketAdminsCrud));
      return;
    }
    if (selectedRole !== undefined) {
      setBucketFlags({ ...bitmaskToFlags(selectedRole.bucketCrud), read: true });
      setMessageFlags({ ...bitmaskToFlags(selectedRole.bucketMessagesCrud), read: true });
      setAdminFlags(bitmaskToFlags(bucketAdminsCrudWithRead(selectedRole.bucketAdminsCrud)));
    }
  }, [useRoleDropdown, selectedRoleId, selectedRole, customOption]);

  useEffect(() => {
    if (!useRoleDropdown || highestRole === null) return;
    if (
      selectedRoleId !== EDIT_ADMIN_CREATE_ROLE_ID &&
      selectedRoleId !== EDIT_ADMIN_CUSTOM_ROLE_ID &&
      selectedRole === undefined
    ) {
      setSelectedRoleId(highestRole.id);
    }
  }, [useRoleDropdown, highestRole, selectedRoleId, selectedRole]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (readOnly) return;
    setSubmitError(null);
    setLoading(true);
    try {
      let payload: EditBucketAdminFormPayload;
      if (useRoleDropdown) {
        if (selectedRoleId === EDIT_ADMIN_CREATE_ROLE_ID) {
          if (createNewRoleHref !== undefined && createNewRoleHref !== '') {
            window.location.href = createNewRoleHref;
            setLoading(false);
            return;
          }
          setSubmitError('Select a role');
          setLoading(false);
          return;
        }
        if (selectedRoleId === EDIT_ADMIN_CUSTOM_ROLE_ID && customOption !== null) {
          payload = {
            bucketCrud: customOption.bucketCrud,
            bucketMessagesCrud: customOption.bucketMessagesCrud,
            bucketAdminsCrud: customOption.bucketAdminsCrud,
          };
        } else {
          const role = roleOptions.find((r) => r.id === selectedRoleId);
          if (role === undefined) {
            setSubmitError('Select a role');
            setLoading(false);
            return;
          }
          payload = {
            bucketCrud: role.bucketCrud,
            bucketMessagesCrud: role.bucketMessagesCrud,
            bucketAdminsCrud: bucketAdminsCrudWithRead(role.bucketAdminsCrud),
          };
        }
      } else {
        const bucketCrud = flagsToBitmask(bucketFlags) | CRUD_BITS.read;
        const bucketMessagesCrud = flagsToBitmask(messageFlags) | CRUD_BITS.read | bucketCrud;
        payload = {
          bucketCrud,
          bucketMessagesCrud,
          bucketAdminsCrud: flagsToBitmask(adminFlags) | CRUD_BITS.read,
        };
      }
      await Promise.resolve(onSubmit(payload));
      if (onSuccess !== undefined) {
        onSuccess();
      } else {
        window.location.href = successHref;
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Stack>
        {useRoleDropdown ? (
          <>
            <Select
              label={labels.roleSelectLabel ?? 'Role'}
              options={options}
              value={selectedRoleId}
              disabled={readOnly}
              onChange={(value) => {
                if (
                  value === EDIT_ADMIN_CREATE_ROLE_ID &&
                  createNewRoleHref !== undefined &&
                  createNewRoleHref !== ''
                ) {
                  window.location.href = createNewRoleHref;
                  return;
                }
                setSelectedRoleId(value);
              }}
            />
            {selectedRoleDescription !== null && selectedRoleDescription !== '' ? (
              <Text variant="muted" size="sm">
                {selectedRoleDescription}
              </Text>
            ) : null}
          </>
        ) : null}
        <CrudCheckboxes
          label={labels.adminPermissionsLabel ?? 'Admin permissions'}
          labels={crudLabels}
          flags={adminFlags}
          onChange={setAdminFlagsWithReadForced}
          disabledBits={useRoleDropdown ? undefined : { read: true }}
          disabled={useRoleDropdown || readOnly}
        />
        <CrudCheckboxes
          label={labels.bucketPermissions ?? 'Bucket permissions'}
          labels={crudLabels}
          flags={bucketFlags}
          onChange={setBucketFlagsWithReadForced}
          disabled={useRoleDropdown || readOnly}
          disabledBits={!useRoleDropdown ? { read: true } : undefined}
          selectAllInfo={labels.bucketPermissionsInfo}
        />
        <CrudCheckboxes
          label={labels.bucketMessagesPermissions ?? 'Message permissions'}
          labels={crudLabels}
          flags={messageFlags}
          onChange={setMessageFlagsWithReadForced}
          disabled={useRoleDropdown || readOnly}
          disabledBits={
            !useRoleDropdown
              ? {
                  read: true,
                  create: bucketFlags.create,
                  update: bucketFlags.update,
                  delete: bucketFlags.delete,
                }
              : undefined
          }
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
          {readOnly ? null : (
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={isInvalidRoleSelection}
            >
              {labels.save}
            </Button>
          )}
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
