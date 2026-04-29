'use client';

import type { CrudFlags } from '../../form/CrudCheckboxes/CrudCheckboxes';

import { useEffect, useState } from 'react';

import { CRUD_BITS, formatUserLabel, bitmaskToFlags, flagsToBitmask } from '@metaboost/helpers';

import { Button } from '../../form/Button/Button';
import { CrudButtons } from '../../form/CrudButtons/CrudButtons';
import { CrudCheckboxes } from '../../form/CrudCheckboxes/CrudCheckboxes';
import { FormContainer } from '../../form/FormContainer/FormContainer';
import { Select } from '../../form/Select/Select';
import { CopyLinkBox } from '../../layout/CopyLinkBox/CopyLinkBox';
import { Divider } from '../../layout/Divider/Divider';
import { SectionWithHeading } from '../../layout/SectionWithHeading/SectionWithHeading';
import { Stack } from '../../layout/Stack/Stack';
import { Text } from '../../layout/Text/Text';
import { UnorderedList } from '../../layout/UnorderedList/UnorderedList';
import { Link } from '../../navigation/Link/Link';

import styles from './BucketAdminsView.module.scss';

export const CREATE_NEW_ROLE_VALUE = '__create_new__';

export type BucketAdminRoleOption = {
  id: string;
  label: string;
  description?: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
};

export type BucketAdminRow = {
  id: string;
  bucketId: string;
  userId: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud?: number;
  createdAt: string;
  user: {
    id: string;
    idText: string;
    email: string | null;
    username?: string | null;
    displayName: string | null;
  } | null;
};

export type BucketAdminInvitationRow = {
  id: string;
  token: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud?: number;
  status: string;
  expiresAt: string;
};

export type BucketAdminsViewLabels = {
  addAdmin: string;
  addAdminDescription: string;
  bucketPermissions: string;
  bucketMessagesPermissions: string;
  adminPermissionsLabel: string;
  bucketPermissionsInfo?: string;
  crudCreate: string;
  crudRead: string;
  crudUpdate: string;
  crudDelete: string;
  noAdminsYet: string;
  edit: string;
  delete: string;
  deleteConfirmAdmin: string;
  deleteConfirmInvitation: string;
  owner: string;
  pendingInvitations: string;
  invitationLink: string;
  expires: string;
  inviteLinkCopy: string;
  copy: string;
  copied: string;
  save: string;
  cancel: string;
  /** Optional fallback when a delete callback returns { ok: false, error }. If not set, the returned error is shown. */
  deleteError?: string;
};

const CRUD_ORDER: Array<'create' | 'read' | 'update' | 'delete'> = [
  'create',
  'read',
  'update',
  'delete',
];

function formatCrudMask(
  mask: number,
  labels: Record<'create' | 'read' | 'update' | 'delete', string>
): string {
  const flags = bitmaskToFlags(mask);
  const set = CRUD_ORDER.filter((k) => flags[k]).map((k) => labels[k]);
  return set.length > 0 ? set.join(', ') : '—';
}

export type BucketAdminsViewProps = {
  admins: BucketAdminRow[];
  pendingInvitations: BucketAdminInvitationRow[];
  ownerId: string;
  labels: BucketAdminsViewLabels;
  /** Create invitation; returns token on success or error message. */
  onCreateInvitation: (body: {
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
  }) => Promise<{ token: string } | { error: string }>;
  /**
   * Best-effort delete of a bucket admin. May return { ok: false, error } on failure;
   * the view will show that error. Parent may still update list only when ok.
   */
  onDeleteAdmin: (userId: string) => void | Promise<void | { ok: boolean; error?: string }>;
  /**
   * Best-effort delete of a pending invitation. May return { ok: false, error } on failure;
   * the view will show that error. Parent may still update list only when ok.
   */
  onDeleteInvitation: (
    invitationId: string
  ) => void | Promise<void | { ok: boolean; error?: string }>;
  /** Build edit page URL for an admin (userId is idText or UUID). */
  getEditHref: (userId: string) => string;
  /** Build full invite link URL from token (e.g. origin + /invite/{token}). */
  getInviteLinkUrl: (token: string) => string;
  /** Optional: locale for formatting invitation expiry (e.g. from useLocale()). */
  locale?: string;
  /** When provided, show role dropdown instead of CRUD checkboxes. Role options (predefined + custom). */
  roleOptions?: BucketAdminRoleOption[];
  /** When set with roleOptions, show "Create new role…" in the role dropdown; selecting it and submitting navigates here. */
  createNewRoleHref?: string;
  /** Label for the role dropdown (when roleOptions is used). */
  roleSelectLabel?: string;
  /** Label for the "Custom Role" option (when createNewRoleHref is set). */
  createNewRoleOptionLabel?: string;
};

function formatExpiresAt(locale: string, expiresAt: string): string {
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

function rolePermissionScore(role: BucketAdminRoleOption): number {
  return role.bucketCrud + role.bucketMessagesCrud + role.bucketAdminsCrud;
}

export function BucketAdminsView({
  admins,
  pendingInvitations,
  ownerId,
  labels,
  onCreateInvitation,
  onDeleteAdmin,
  onDeleteInvitation,
  getEditHref,
  getInviteLinkUrl,
  locale = 'en-US',
  roleOptions = [],
  createNewRoleHref,
  roleSelectLabel = 'Role',
  createNewRoleOptionLabel = 'Custom Role',
}: BucketAdminsViewProps) {
  const crudLabels: Record<'create' | 'read' | 'update' | 'delete', string> = {
    create: labels.crudCreate,
    read: labels.crudRead,
    update: labels.crudUpdate,
    delete: labels.crudDelete,
  };
  const useRoleDropdown =
    roleOptions.length > 0 || (createNewRoleHref !== undefined && createNewRoleHref !== '');

  const [bucketFlags, setBucketFlags] = useState<CrudFlags>({
    create: false,
    read: true,
    update: false,
    delete: false,
  });
  const [messageFlags, setMessageFlags] = useState<CrudFlags>({
    create: true,
    read: true,
    update: false,
    delete: false,
  });
  const [adminFlags, setAdminFlags] = useState<CrudFlags>({
    create: false,
    read: true,
    update: false,
    delete: false,
  });
  const selectOptions = roleOptions.map((r) => ({ value: r.id, label: r.label }));
  if (createNewRoleHref !== undefined && createNewRoleHref !== '') {
    selectOptions.push({ value: CREATE_NEW_ROLE_VALUE, label: createNewRoleOptionLabel });
  }
  const highestRole =
    roleOptions.length > 0
      ? roleOptions.reduce((best, role) =>
          rolePermissionScore(role) > rolePermissionScore(best) ? role : best
        )
      : null;
  const initialRoleId =
    highestRole !== null
      ? highestRole.id
      : createNewRoleHref !== undefined && createNewRoleHref !== ''
        ? CREATE_NEW_ROLE_VALUE
        : (selectOptions[0]?.value ?? '');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoleId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

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

  const selectedRole = roleOptions.find((r) => r.id === selectedRoleId);
  const isInvalidRoleSelection =
    useRoleDropdown && selectedRoleId !== CREATE_NEW_ROLE_VALUE && selectedRole === undefined;
  const selectedRoleDescription =
    selectedRoleId !== CREATE_NEW_ROLE_VALUE ? (selectedRole?.description ?? null) : null;

  useEffect(() => {
    if (!useRoleDropdown || selectedRole === undefined) return;
    setBucketFlags(bitmaskToFlags(selectedRole.bucketCrud));
    setMessageFlags(bitmaskToFlags(selectedRole.bucketMessagesCrud));
    setAdminFlags(bitmaskToFlags(selectedRole.bucketAdminsCrud));
  }, [selectedRole, useRoleDropdown]);

  useEffect(() => {
    if (!useRoleDropdown || highestRole === null) return;
    if (selectedRoleId === CREATE_NEW_ROLE_VALUE) return;
    if (selectedRole === undefined) {
      setSelectedRoleId(highestRole.id);
    }
  }, [useRoleDropdown, highestRole, selectedRole, selectedRoleId]);

  const handleGenerateLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setInviteLink(null);
    if (useRoleDropdown) {
      if (selectedRoleId === CREATE_NEW_ROLE_VALUE) {
        if (createNewRoleHref !== undefined && createNewRoleHref !== '') {
          window.location.href = createNewRoleHref;
        }
        return;
      }
      const role = roleOptions.find((r) => r.id === selectedRoleId);
      if (role === undefined) {
        setSubmitError('Select a role');
        return;
      }
      setLoading(true);
      try {
        const result = await onCreateInvitation({
          bucketCrud: role.bucketCrud,
          bucketMessagesCrud: role.bucketMessagesCrud,
          bucketAdminsCrud: role.bucketAdminsCrud | CRUD_BITS.read,
        });
        if ('token' in result) {
          setInviteLink(getInviteLinkUrl(result.token));
        } else {
          setSubmitError(result.error);
        }
      } catch {
        setSubmitError('Network error');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const bucketCrud = flagsToBitmask(bucketFlags) | CRUD_BITS.read;
        const bucketMessagesCrud = flagsToBitmask(messageFlags) | CRUD_BITS.read | bucketCrud;
        const result = await onCreateInvitation({
          bucketCrud,
          bucketMessagesCrud,
          bucketAdminsCrud: flagsToBitmask(adminFlags) | CRUD_BITS.read,
        });
        if ('token' in result) {
          setInviteLink(getInviteLinkUrl(result.token));
        } else {
          setSubmitError(result.error);
        }
      } catch {
        setSubmitError('Network error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAdmin = async (adminUserId: string) => {
    setDeleteError(null);
    if (!confirm(labels.deleteConfirmAdmin)) return;
    const result = await Promise.resolve(onDeleteAdmin(adminUserId));
    if (
      result !== undefined &&
      typeof result === 'object' &&
      result !== null &&
      'ok' in result &&
      result.ok === false &&
      typeof result.error === 'string'
    ) {
      setDeleteError(labels.deleteError ?? result.error);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    setDeleteError(null);
    if (!confirm(labels.deleteConfirmInvitation)) return;
    const result = await Promise.resolve(onDeleteInvitation(invitationId));
    if (
      result !== undefined &&
      typeof result === 'object' &&
      result !== null &&
      'ok' in result &&
      result.ok === false &&
      typeof result.error === 'string'
    ) {
      setDeleteError(labels.deleteError ?? result.error);
    }
  };

  return (
    <>
      <FormContainer onSubmit={handleGenerateLink}>
        <Stack>
          <Text as="p" variant="muted">
            {labels.addAdminDescription}
          </Text>
          {useRoleDropdown ? (
            <>
              <Select
                label={roleSelectLabel}
                options={selectOptions}
                value={selectedRoleId}
                onChange={(value) => {
                  if (value === CREATE_NEW_ROLE_VALUE && createNewRoleHref !== undefined) {
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
            label={labels.adminPermissionsLabel}
            labels={crudLabels}
            flags={adminFlags}
            onChange={setAdminFlagsWithReadForced}
            disabledBits={useRoleDropdown ? undefined : { read: true }}
            disabled={useRoleDropdown}
          />
          <CrudCheckboxes
            label={labels.bucketPermissions}
            labels={crudLabels}
            flags={bucketFlags}
            onChange={setBucketFlagsWithReadForced}
            disabled={useRoleDropdown}
            disabledBits={!useRoleDropdown ? { read: true } : undefined}
            selectAllInfo={labels.bucketPermissionsInfo}
          />
          <CrudCheckboxes
            label={labels.bucketMessagesPermissions}
            labels={crudLabels}
            flags={messageFlags}
            onChange={setMessageFlagsWithReadForced}
            disabled={useRoleDropdown}
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
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={isInvalidRoleSelection}
          >
            {labels.addAdmin}
          </Button>
          {inviteLink !== null && (
            <CopyLinkBox
              value={inviteLink}
              description={labels.inviteLinkCopy}
              copyLabel={labels.copy}
              copiedLabel={labels.copied}
              inputAriaLabel={labels.inviteLinkCopy}
            />
          )}
        </Stack>
        <Divider />

        {deleteError !== null && (
          <Text variant="error" size="sm" as="p" role="alert">
            {deleteError}
          </Text>
        )}
        {admins.length === 0 ? (
          <Text variant="muted">{labels.noAdminsYet}</Text>
        ) : (
          <UnorderedList>
            {admins.map((a) => {
              const userIdForHref = a.user?.idText ?? a.userId;
              return (
                <li key={a.id} className={styles.listItem}>
                  <div>
                    <Text>
                      {a.user !== undefined && a.user !== null
                        ? formatUserLabel({
                            username: a.user.username,
                            email: a.user.email,
                            displayName: a.user.displayName,
                          })
                        : a.userId}
                    </Text>
                    <Text variant="muted" as="p" className={styles.bucketAdminsCrudMeta}>
                      Bucket: {formatCrudMask(a.bucketCrud, crudLabels)}
                      <br />
                      Message: {formatCrudMask(a.bucketMessagesCrud, crudLabels)}
                      <br />
                      Admin: {formatCrudMask(a.bucketAdminsCrud ?? CRUD_BITS.read, crudLabels)}
                    </Text>
                  </div>
                  <div className={styles.actions}>
                    {a.userId !== ownerId ? (
                      <CrudButtons
                        editHref={getEditHref(userIdForHref)}
                        editLabel={labels.edit}
                        onDelete={() => handleDeleteAdmin(userIdForHref)}
                        deleteLabel={labels.delete}
                      />
                    ) : (
                      <Text variant="muted" size="sm">
                        {labels.owner}
                      </Text>
                    )}
                  </div>
                </li>
              );
            })}
          </UnorderedList>
        )}
      </FormContainer>

      {pendingInvitations.length > 0 ? (
        <>
          <Divider />
          <SectionWithHeading title={labels.pendingInvitations}>
            <table className={styles.pendingTable}>
              <thead>
                <tr>
                  <th scope="col">{labels.invitationLink}</th>
                  <th scope="col">{labels.expires}</th>
                  <th scope="col" aria-label={labels.delete} />
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((inv) => {
                  const url = getInviteLinkUrl(inv.token);
                  return (
                    <tr key={inv.id}>
                      <td>
                        <Link href={url} target="_blank" rel="noopener noreferrer">
                          {url}
                        </Link>
                      </td>
                      <td>{formatExpiresAt(locale, inv.expiresAt)}</td>
                      <td>
                        <CrudButtons
                          onDelete={() => handleDeleteInvitation(inv.id)}
                          deleteLabel={labels.delete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SectionWithHeading>
        </>
      ) : null}
    </>
  );
}
