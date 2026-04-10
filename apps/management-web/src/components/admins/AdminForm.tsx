'use client';

import type { CrudBit } from '@metaboost/helpers';
import type {
  ManagementAdminRoleItem,
  CreateAdminBody,
  EventVisibility,
  UpdateAdminBody,
} from '@metaboost/helpers-requests';
import type { CrudFlags } from '@metaboost/ui';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { bitmaskToFlags, flagsToBitmask, validatePassword } from '@metaboost/helpers';
import { managementWebAdminRoles, managementWebAdmins } from '@metaboost/helpers-requests';
import {
  Button,
  CrudCheckboxes,
  FormActions,
  FormContainer,
  FormSection,
  Input,
  PasswordStrengthMeter,
  Select,
  Stack,
  Text,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { adminRolesNewRoute, ROUTES } from '../../lib/routes';

type ManagementAdminRoleOption = {
  id: string;
  label: string;
  description: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
};

const ADMIN_FORM_CREATE_ROLE_ID = '__create_role__';
const ADMIN_FORM_CUSTOM_ROLE_ID = '__custom__';

export type AdminFormInitialValues = {
  displayName: string;
  username: string;
  permissions: {
    adminsCrud: number;
    usersCrud: number;
    bucketsCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
    eventVisibility: EventVisibility;
  } | null;
};

export type AdminFormProps = {
  mode: 'create' | 'edit';
  adminId?: string;
  initialValues?: AdminFormInitialValues;
  /** Current user can edit CRUD permissions (has create or update for admins). When false, permissions section is hidden. */
  canEditPermissions: boolean;
  /** When editing, the admin being edited is the super admin. No one can change super admin's permissions; section is hidden. */
  targetIsSuperAdmin?: boolean;
};

function isValidUsername(value: string): boolean {
  const t = value.trim();
  return t.length > 0 && t.length <= 50;
}

function roleDescription(roleId: string, tRoles: (key: string) => string): string {
  if (roleId === 'everything') return tRoles('descriptionEverything');
  if (roleId === 'users_full') return tRoles('descriptionUsersFull');
  if (roleId === 'bucket_full') return tRoles('descriptionBucketFull');
  if (roleId === 'read_everything') return tRoles('descriptionReadEverything');
  if (roleId === 'bucket_read') return tRoles('descriptionBucketRead');
  return tRoles('descriptionCustomRole');
}

function roleToOption(
  role: ManagementAdminRoleItem,
  tRoles: (key: string) => string
): ManagementAdminRoleOption {
  const id = role.id;
  const label =
    role.isPredefined && 'nameKey' in role
      ? (() => {
          const key = role.nameKey.split('.').pop();
          return key !== undefined ? tRoles(key) : role.nameKey;
        })()
      : 'name' in role
        ? role.name
        : id;
  return {
    id,
    label,
    description: roleDescription(id, tRoles),
    adminsCrud: role.adminsCrud,
    usersCrud: role.usersCrud,
    bucketsCrud: role.bucketsCrud,
    bucketMessagesCrud: role.bucketMessagesCrud,
    bucketAdminsCrud: role.bucketAdminsCrud,
    eventVisibility: role.eventVisibility,
  };
}

function rolePermissionScore(role: ManagementAdminRoleOption): number {
  const crudScore =
    role.adminsCrud +
    role.usersCrud +
    role.bucketsCrud +
    role.bucketMessagesCrud +
    role.bucketAdminsCrud;
  const eventScore =
    role.eventVisibility === 'all' ? 2 : role.eventVisibility === 'all_admins' ? 1 : 0;
  return crudScore * 10 + eventScore;
}

export function AdminForm({
  mode,
  adminId,
  initialValues,
  canEditPermissions,
  targetIsSuperAdmin = false,
}: AdminFormProps) {
  const router = useRouter();
  const t = useTranslations('common.adminForm');
  const tRoles = useTranslations('roles');
  const apiBaseUrl = getManagementApiBaseUrl();

  const crudLabels: Record<CrudBit, string> = {
    create: t('crudCreate'),
    read: t('crudRead'),
    update: t('crudUpdate'),
    delete: t('crudDelete'),
  };

  const [displayName, setDisplayName] = useState(initialValues?.displayName ?? '');
  const [username, setUsername] = useState(initialValues?.username ?? '');
  const [password, setPassword] = useState('');

  // Touched state: show field errors only after the user has interacted with the field
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const defaultPerms = initialValues?.permissions;
  // New admins: admins/users default to all on; buckets/messages default to 0 (all disabled).
  const defaultAdminsCrud = mode === 'create' ? 15 : (defaultPerms?.adminsCrud ?? 0);
  const defaultUsersCrud = mode === 'create' ? 15 : (defaultPerms?.usersCrud ?? 0);
  const defaultBucketsCrud = defaultPerms?.bucketsCrud ?? 0;
  const defaultBucketMessagesCrud = defaultPerms?.bucketMessagesCrud ?? 0;
  const defaultBucketAdminsCrud = defaultPerms?.bucketAdminsCrud ?? 0;
  const [adminsCrudFlags, setAdminsCrudFlags] = useState<CrudFlags>(
    bitmaskToFlags(defaultAdminsCrud)
  );
  const [usersCrudFlags, setUsersCrudFlags] = useState<CrudFlags>(bitmaskToFlags(defaultUsersCrud));
  const [bucketsCrudFlags, setBucketsCrudFlags] = useState<CrudFlags>(
    bitmaskToFlags(defaultBucketsCrud)
  );
  const [bucketMessagesCrudFlags, setBucketMessagesCrudFlags] = useState<CrudFlags>(
    bitmaskToFlags(defaultBucketMessagesCrud)
  );
  const [bucketAdminsCrudFlags, setBucketAdminsCrudFlags] = useState<CrudFlags>(
    bitmaskToFlags(defaultBucketAdminsCrud)
  );
  const [eventVisibility, setEventVisibility] = useState<EventVisibility>(
    defaultPerms?.eventVisibility ?? 'all_admins'
  );
  const [roleOptions, setRoleOptions] = useState<ManagementAdminRoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const eventVisibilityOptions = [
    { value: 'own' as EventVisibility, label: t('eventVisibilityOwn') },
    { value: 'all_admins' as EventVisibility, label: t('eventVisibilityAllAdmins') },
    { value: 'all' as EventVisibility, label: t('eventVisibilityAll') },
  ];

  useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await managementWebAdminRoles.listManagementAdminRoles(apiBaseUrl);
      if (!active) return;
      if (!res.ok || res.data === undefined) {
        setLoadingRoles(false);
        return;
      }
      const mapped = res.data.roles.map((role) => roleToOption(role, tRoles));
      setRoleOptions(mapped);
      setLoadingRoles(false);
    };
    void run();
    return () => {
      active = false;
    };
  }, [apiBaseUrl, tRoles]);

  useEffect(() => {
    if (loadingRoles || roleOptions.length === 0) return;
    const hasValidSelectedRole = roleOptions.some((role) => role.id === selectedRoleId);
    if (hasValidSelectedRole) return;
    const highestRole = roleOptions.reduce((best, role) =>
      rolePermissionScore(role) > rolePermissionScore(best) ? role : best
    );
    setSelectedRoleId(highestRole.id);
  }, [loadingRoles, roleOptions, selectedRoleId]);

  const selectedRole = useMemo(
    () => roleOptions.find((role) => role.id === selectedRoleId),
    [roleOptions, selectedRoleId]
  );

  useEffect(() => {
    if (selectedRole === undefined) return;
    setAdminsCrudFlags(bitmaskToFlags(selectedRole.adminsCrud));
    setUsersCrudFlags(bitmaskToFlags(selectedRole.usersCrud));
    setBucketsCrudFlags(bitmaskToFlags(selectedRole.bucketsCrud));
    setBucketMessagesCrudFlags(bitmaskToFlags(selectedRole.bucketMessagesCrud));
    setBucketAdminsCrudFlags(bitmaskToFlags(selectedRole.bucketAdminsCrud));
    setEventVisibility(selectedRole.eventVisibility);
  }, [selectedRole]);

  // --- Field validation ---

  const displayNameError =
    displayNameTouched && displayName.trim() === '' ? t('displayNameRequired') : null;

  const usernameError = usernameTouched
    ? username.trim() === ''
      ? t('usernameRequired')
      : !isValidUsername(username.trim())
        ? t('usernameInvalid')
        : null
    : null;

  const passwordValidation =
    mode === 'create' || password !== ''
      ? validatePassword(password, {
          required: t('passwordRequired'),
          minLength: (min) => t('passwordMinLength', { count: min }),
          maxLength: (max) => t('passwordMaxLength', { count: max }),
          requirements: t('passwordInsecure'),
        })
      : { valid: true as const };

  const passwordError = passwordTouched
    ? passwordValidation.valid
      ? null
      : passwordValidation.message
    : null;

  const roleSelectOptions = [
    ...roleOptions.map((role) => ({ value: role.id, label: role.label })),
    { value: ADMIN_FORM_CREATE_ROLE_ID, label: t('customRoleOptionLabel') },
  ];
  if (selectedRoleId === ADMIN_FORM_CUSTOM_ROLE_ID) {
    roleSelectOptions.unshift({
      value: ADMIN_FORM_CUSTOM_ROLE_ID,
      label: t('customRoleLabel'),
    });
  }
  const selectedRoleDescription =
    selectedRoleId === ADMIN_FORM_CUSTOM_ROLE_ID || selectedRole === undefined
      ? tRoles('descriptionCustomRole')
      : selectedRole.description;
  const isInvalidRoleSelection =
    canEditPermissions &&
    !loadingRoles &&
    roleOptions.length > 0 &&
    selectedRoleId !== ADMIN_FORM_CREATE_ROLE_ID &&
    selectedRoleId !== ADMIN_FORM_CUSTOM_ROLE_ID &&
    selectedRole === undefined;

  // --- CRUD change handlers (enforce read dependency) ---

  const handleAdminsCrudChange = (next: CrudFlags) => {
    setAdminsCrudFlags(next);
  };

  const handleUsersCrudChange = (next: CrudFlags) => {
    setUsersCrudFlags(next);
  };

  const handleBucketsCrudChange = (next: CrudFlags) => {
    setBucketsCrudFlags(next);
  };

  const handleBucketMessagesCrudChange = (next: CrudFlags) => {
    setBucketMessagesCrudFlags(next);
  };

  const handleBucketAdminsCrudChange = (next: CrudFlags) => {
    setBucketAdminsCrudFlags(next);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Touch all fields to surface any hidden errors
    setDisplayNameTouched(true);
    setUsernameTouched(true);
    setPasswordTouched(true);

    // Guard: check validity before submitting
    if (displayName.trim() === '') return;
    if (username.trim() === '' || !isValidUsername(username.trim())) return;
    if (mode === 'create' && !passwordValidation.valid) return;
    if (password !== '' && !passwordValidation.valid) return;

    setSubmitError(null);
    if (selectedRoleId === ADMIN_FORM_CREATE_ROLE_ID) {
      const returnUrl =
        mode === 'create'
          ? ROUTES.ADMINS_NEW
          : adminId !== undefined
            ? `/admin/${adminId}/edit`
            : ROUTES.ADMINS;
      router.push(adminRolesNewRoute(returnUrl));
      return;
    }
    if (isInvalidRoleSelection) {
      setSubmitError(t('roleSelectLabel'));
      return;
    }
    setLoading(true);

    try {
      if (mode === 'create') {
        const body: CreateAdminBody = {
          displayName: displayName.trim(),
          username: username.trim(),
          password,
          roleId:
            selectedRoleId !== '' &&
            selectedRoleId !== ADMIN_FORM_CUSTOM_ROLE_ID &&
            selectedRoleId !== ADMIN_FORM_CREATE_ROLE_ID
              ? selectedRoleId
              : undefined,
          adminsCrud: flagsToBitmask(adminsCrudFlags),
          usersCrud: flagsToBitmask(usersCrudFlags),
          bucketsCrud: flagsToBitmask(bucketsCrudFlags),
          bucketMessagesCrud: flagsToBitmask(bucketMessagesCrudFlags),
          bucketAdminsCrud: flagsToBitmask(bucketAdminsCrudFlags),
          eventVisibility,
        };
        const res = await managementWebAdmins.createAdmin(apiBaseUrl, body);
        if (!res.ok) {
          setSubmitError(res.error.message ?? t('createFailed'));
          return;
        }
        router.push(ROUTES.ADMINS);
        router.refresh();
      } else {
        if (adminId === undefined) return;
        const body: UpdateAdminBody = {};
        if (displayName.trim() !== (initialValues?.displayName ?? '')) {
          body.displayName = displayName.trim();
        }
        if (username.trim() !== (initialValues?.username ?? '')) {
          body.username = username.trim();
        }
        if (password !== '') {
          body.password = password;
        }
        const maySetPermissions = canEditPermissions && (mode !== 'edit' || !targetIsSuperAdmin);
        if (maySetPermissions) {
          if (
            selectedRoleId !== '' &&
            selectedRoleId !== ADMIN_FORM_CUSTOM_ROLE_ID &&
            selectedRoleId !== ADMIN_FORM_CREATE_ROLE_ID
          ) {
            body.roleId = selectedRoleId;
          } else {
            body.adminsCrud = flagsToBitmask(adminsCrudFlags);
            body.usersCrud = flagsToBitmask(usersCrudFlags);
            body.bucketsCrud = flagsToBitmask(bucketsCrudFlags);
            body.bucketMessagesCrud = flagsToBitmask(bucketMessagesCrudFlags);
            body.bucketAdminsCrud = flagsToBitmask(bucketAdminsCrudFlags);
            body.eventVisibility = eventVisibility;
          }
        }
        const res = await managementWebAdmins.updateAdmin(apiBaseUrl, adminId, body);
        if (!res.ok) {
          setSubmitError(res.error.message ?? t('updateFailed'));
          return;
        }
        router.push(ROUTES.ADMINS);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <Stack>
        <Input
          label={t('displayName')}
          value={displayName}
          onChange={setDisplayName}
          onBlur={() => setDisplayNameTouched(true)}
          error={displayNameError}
          autoComplete="off"
        />
        <Input
          label={t('username')}
          type="text"
          value={username}
          onChange={setUsername}
          onBlur={() => setUsernameTouched(true)}
          error={usernameError}
          autoComplete="off"
        />
        <Input
          label={mode === 'create' ? t('password') : t('passwordEditHint')}
          type="password"
          value={password}
          onChange={setPassword}
          onBlur={() => setPasswordTouched(true)}
          error={passwordError}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={password} />

        {canEditPermissions && (mode === 'create' || !targetIsSuperAdmin) && (
          <FormSection title={t('permissions')}>
            {loadingRoles ? (
              <Text variant="muted">{t('loadingRoles')}</Text>
            ) : (
              <>
                <Select
                  label={t('roleSelectLabel')}
                  value={selectedRoleId}
                  onChange={(value) => {
                    if (value === ADMIN_FORM_CREATE_ROLE_ID) {
                      const returnUrl =
                        mode === 'create'
                          ? ROUTES.ADMINS_NEW
                          : adminId !== undefined
                            ? `/admin/${adminId}/edit`
                            : ROUTES.ADMINS;
                      router.push(adminRolesNewRoute(returnUrl));
                      return;
                    }
                    setSelectedRoleId(value);
                  }}
                  options={roleSelectOptions}
                />
                <Text variant="muted" size="sm">
                  {selectedRoleDescription}
                </Text>
              </>
            )}
            <CrudCheckboxes
              label={t('adminsCrud')}
              labels={crudLabels}
              flags={adminsCrudFlags}
              onChange={handleAdminsCrudChange}
              disabled
              error={null}
            />
            <CrudCheckboxes
              label={t('usersCrud')}
              labels={crudLabels}
              flags={usersCrudFlags}
              onChange={handleUsersCrudChange}
              disabled
            />
            <CrudCheckboxes
              label={t('bucketsCrud')}
              labels={crudLabels}
              flags={bucketsCrudFlags}
              onChange={handleBucketsCrudChange}
              disabled
            />
            <CrudCheckboxes
              label={t('bucketAdminsCrud')}
              labels={crudLabels}
              flags={bucketAdminsCrudFlags}
              onChange={handleBucketAdminsCrudChange}
              disabled
            />
            <CrudCheckboxes
              label={t('bucketMessagesCrud')}
              labels={crudLabels}
              flags={bucketMessagesCrudFlags}
              onChange={handleBucketMessagesCrudChange}
              disabled
            />
            <Select
              label={t('eventVisibility')}
              value={eventVisibility}
              onChange={(v) => setEventVisibility(v as EventVisibility)}
              options={eventVisibilityOptions}
              disabled
            />
          </FormSection>
        )}

        {submitError !== null && (
          <Text variant="error" role="alert">
            {submitError}
          </Text>
        )}

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(ROUTES.ADMINS)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={isInvalidRoleSelection}
          >
            {mode === 'create' ? t('createAdmin') : t('saveChanges')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
