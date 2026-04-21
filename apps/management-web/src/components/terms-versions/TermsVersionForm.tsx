'use client';

import type {
  CreateManagementTermsVersionBody,
  ManagementTermsVersion,
  TermsVersionLifecycleStatus,
  UpdateManagementTermsVersionBody,
} from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { managementWebTermsVersions } from '@metaboost/helpers-requests';
import {
  Button,
  FormActions,
  FormContainer,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../config/env';
import { ROUTES } from '../../lib/routes';

type TermsVersionFormMode = 'create' | 'edit';

const MUTABLE_STATUSES: TermsVersionLifecycleStatus[] = ['draft', 'upcoming'];

export type TermsVersionFormProps = {
  mode: TermsVersionFormMode;
  termsVersion?: ManagementTermsVersion;
};

function toInputDateTime(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string): string | null {
  if (value.trim() === '') {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export function TermsVersionForm({ mode, termsVersion }: TermsVersionFormProps) {
  const tCommon = useTranslations('common');
  const tForm = useTranslations('common.termsVersionForm');
  const router = useRouter();
  const apiBaseUrl = getManagementApiBaseUrl();

  const [versionKey, setVersionKey] = useState(termsVersion?.versionKey ?? '');
  const [title, setTitle] = useState(termsVersion?.title ?? '');
  const [contentTextEnUs, setContentTextEnUs] = useState(termsVersion?.contentTextEnUs ?? '');
  const [contentTextEs, setContentTextEs] = useState(termsVersion?.contentTextEs ?? '');
  const [announcementStartsAtInput, setAnnouncementStartsAtInput] = useState(
    toInputDateTime(termsVersion?.announcementStartsAt ?? null)
  );
  const [enforcementStartsAtInput, setEnforcementStartsAtInput] = useState(
    toInputDateTime(termsVersion?.enforcementStartsAt ?? '')
  );
  const [status, setStatus] = useState<TermsVersionLifecycleStatus>(
    termsVersion?.status ?? 'draft'
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /** Browser local zone for `datetime-local` (IANA id + readable name). */
  const [scheduleTimeZoneInfo, setScheduleTimeZoneInfo] = useState<{
    iana: string;
    longName: string;
  } | null>(null);

  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    const iana = resolved.timeZone;
    let longName = '';
    try {
      longName =
        new Intl.DateTimeFormat(undefined, {
          timeZone: iana,
          timeZoneName: 'long',
        })
          .formatToParts(new Date())
          .find((part) => part.type === 'timeZoneName')?.value ?? '';
    } catch {
      longName = '';
    }
    setScheduleTimeZoneInfo({ iana, longName });
  }, []);

  const isEditable =
    mode === 'create' || (termsVersion !== undefined && MUTABLE_STATUSES.includes(status));

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: tCommon('termsVersionStatus.draft') },
      { value: 'upcoming', label: tCommon('termsVersionStatus.upcoming') },
    ],
    [tCommon]
  );

  const titleError = submitAttempted && title.trim() === '' ? tForm('titleRequired') : null;
  const versionKeyError =
    submitAttempted && mode === 'create' && versionKey.trim() === ''
      ? tForm('versionKeyRequired')
      : null;
  const contentTextEnUsError =
    submitAttempted && contentTextEnUs.trim() === '' ? tForm('contentTextEnUsRequired') : null;
  const contentTextEsError =
    submitAttempted && contentTextEs.trim() === '' ? tForm('contentTextEsRequired') : null;
  const enforcementStartsAtError =
    submitAttempted && toIsoDateTime(enforcementStartsAtInput) === null
      ? tForm('enforcementStartsAtRequired')
      : null;
  const announcementStartsAtError =
    submitAttempted &&
    announcementStartsAtInput.trim() !== '' &&
    toIsoDateTime(announcementStartsAtInput) === null
      ? tForm('invalidDateTime')
      : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!isEditable) {
      return;
    }

    const enforcementStartsAtIso = toIsoDateTime(enforcementStartsAtInput);
    const announcementStartsAtIso =
      announcementStartsAtInput.trim() === '' ? null : toIsoDateTime(announcementStartsAtInput);

    if (
      title.trim() === '' ||
      contentTextEnUs.trim() === '' ||
      contentTextEs.trim() === '' ||
      enforcementStartsAtIso === null ||
      (announcementStartsAtInput.trim() !== '' && announcementStartsAtIso === null) ||
      (mode === 'create' && versionKey.trim() === '')
    ) {
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      if (mode === 'create') {
        const createBody: CreateManagementTermsVersionBody = {
          versionKey: versionKey.trim(),
          title: title.trim(),
          contentTextEnUs: contentTextEnUs.trim(),
          contentTextEs: contentTextEs.trim(),
          enforcementStartsAt: enforcementStartsAtIso,
          status: status === 'upcoming' ? 'upcoming' : 'draft',
          ...(announcementStartsAtIso !== null
            ? { announcementStartsAt: announcementStartsAtIso }
            : {}),
        };
        const res = await managementWebTermsVersions.reqCreateTermsVersion(apiBaseUrl, createBody);
        if (!res.ok) {
          setSubmitError(res.error.message);
          return;
        }
        if (res.data === undefined) {
          setSubmitError(tForm('createFailed'));
          return;
        }
        router.push(ROUTES.TERMS_VERSIONS);
        router.refresh();
        return;
      }

      if (termsVersion === undefined) {
        setSubmitError(tForm('updateFailed'));
        return;
      }

      const updateBody: UpdateManagementTermsVersionBody = {
        title: title.trim(),
        contentTextEnUs: contentTextEnUs.trim(),
        contentTextEs: contentTextEs.trim(),
        enforcementStartsAt: enforcementStartsAtIso,
        announcementStartsAt: announcementStartsAtIso,
        status: status === 'upcoming' ? 'upcoming' : 'draft',
      };
      const res = await managementWebTermsVersions.reqUpdateTermsVersion(
        apiBaseUrl,
        termsVersion.id,
        updateBody
      );
      if (!res.ok) {
        setSubmitError(res.error.message);
        return;
      }
      if (res.data === undefined) {
        setSubmitError(tForm('updateFailed'));
        return;
      }
      router.push(ROUTES.TERMS_VERSIONS);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormContainer
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <Stack>
        {mode === 'edit' && termsVersion !== undefined ? (
          <Input
            label={tForm('versionKey')}
            value={termsVersion.versionKey}
            onChange={() => {}}
            readOnly
            disabled
          />
        ) : (
          <Input
            label={tForm('versionKey')}
            value={versionKey}
            onChange={setVersionKey}
            error={versionKeyError}
            autoComplete="off"
          />
        )}
        <Input
          label={tForm('title')}
          value={title}
          onChange={setTitle}
          error={titleError}
          autoComplete="off"
          disabled={!isEditable}
        />
        <Textarea
          label={tForm('contentTextEnUs')}
          value={contentTextEnUs}
          onChange={setContentTextEnUs}
          error={contentTextEnUsError}
          minRows={12}
          disabled={!isEditable}
        />
        <Textarea
          label={tForm('contentTextEs')}
          value={contentTextEs}
          onChange={setContentTextEs}
          error={contentTextEsError}
          minRows={12}
          disabled={!isEditable}
        />
        <Text variant="muted">{tForm('formattingHint')}</Text>
        {scheduleTimeZoneInfo !== null ? (
          <Text variant="muted" size="sm">
            {scheduleTimeZoneInfo.longName !== ''
              ? tForm('scheduleDateTimeTimezoneNote', {
                  timeZone: scheduleTimeZoneInfo.iana,
                  timeZoneLong: scheduleTimeZoneInfo.longName,
                })
              : tForm('scheduleDateTimeTimezoneNoteShort', {
                  timeZone: scheduleTimeZoneInfo.iana,
                })}
          </Text>
        ) : null}
        <Input
          label={tForm('announcementStartsAt')}
          value={announcementStartsAtInput}
          onChange={setAnnouncementStartsAtInput}
          error={announcementStartsAtError}
          placeholder={tForm('dateTimePlaceholder')}
          type="datetime-local"
          disabled={!isEditable}
        />
        <Input
          label={tForm('enforcementStartsAt')}
          value={enforcementStartsAtInput}
          onChange={setEnforcementStartsAtInput}
          error={enforcementStartsAtError}
          placeholder={tForm('dateTimePlaceholder')}
          type="datetime-local"
          disabled={!isEditable}
        />
        <Select
          label={tForm('status')}
          options={statusOptions}
          value={status}
          onChange={(nextValue) => {
            setStatus(nextValue === 'upcoming' ? 'upcoming' : 'draft');
          }}
          disabled={!isEditable}
        />
        {!isEditable && <Text variant="muted">{tCommon('termsVersionReadOnlyNotice')}</Text>}
        {submitError !== null && (
          <Text variant="error" role="alert">
            {submitError}
          </Text>
        )}
        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              router.push(ROUTES.TERMS_VERSIONS);
            }}
            disabled={saving}
          >
            {tForm('cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!isEditable}>
            {mode === 'create' ? tForm('createTermsVersion') : tForm('saveChanges')}
          </Button>
        </FormActions>
      </Stack>
    </FormContainer>
  );
}
