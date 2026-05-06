'use client';

import type { CrudFlags } from '../../../../lib/main-nav';
import type { ResolvedProductMembership } from '@metaboost/helpers';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import {
  type BillingPriceAuditEntryDto,
  type BillingPriceWindowDto,
  managementWebBillingPrices,
  managementWebProductMembership,
} from '@metaboost/helpers-requests';
import {
  Button,
  FormActions,
  FormContainer,
  Input,
  SectionWithHeading,
  Select,
  Stack,
  Table,
  Text,
} from '@metaboost/ui';

import { getManagementApiBaseUrl } from '../../../../config/env';

type ProductsMembershipClientProps = {
  crudFlags: CrudFlags;
};

function formatMajorUnits(locale: string, currencyCode: string, amountCents: number): string {
  try {
    return (amountCents / 100).toLocaleString(locale, {
      style: 'currency',
      currency: currencyCode,
    });
  } catch {
    return (amountCents / 100).toFixed(2);
  }
}

function shortId(value: string | null): string {
  if (value === null || value === '') {
    return '—';
  }
  if (value.length <= 8) {
    return value;
  }
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function ProductsMembershipClient({ crudFlags }: ProductsMembershipClientProps) {
  const t = useTranslations('billingGovernance');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const baseUrl = getManagementApiBaseUrl();

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<ResolvedProductMembership | null>(null);
  const [windows, setWindows] = useState<BillingPriceWindowDto[]>([]);
  const [audit, setAudit] = useState<BillingPriceAuditEntryDto[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deprecateReason, setDeprecateReason] = useState('');

  const [currencyCode, setCurrencyCode] = useState('USD');
  const [billingCadence, setBillingCadence] = useState<'monthly' | 'annual'>('monthly');
  const [amountDollars, setAmountDollars] = useState('');
  const [effectiveLocal, setEffectiveLocal] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [deprecatingId, setDeprecatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    const [memRes, winRes, audRes] = await Promise.all([
      managementWebProductMembership.getResolvedProductMembership(baseUrl),
      managementWebBillingPrices.listBillingPriceWindows(baseUrl),
      managementWebBillingPrices.listBillingPriceAudit(baseUrl, { limit: 80 }),
    ]);

    if (!memRes.ok || memRes.data?.data === undefined) {
      setLoadError(t('loadError'));
      setLoading(false);
      return;
    }
    if (!winRes.ok || winRes.data?.data.windows === undefined) {
      setLoadError(t('loadError'));
      setLoading(false);
      return;
    }
    if (!audRes.ok || audRes.data?.data.entries === undefined) {
      setLoadError(t('loadError'));
      setLoading(false);
      return;
    }

    setMembership(memRes.data.data);
    setWindows(winRes.data.data.windows);
    setAudit(audRes.data.data.entries);
    setLoading(false);
  }, [baseUrl, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const cadenceOptions = [
    { value: 'monthly', label: t('cadenceMonthly') },
    { value: 'annual', label: t('cadenceAnnual') },
  ];

  const scheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFlash(null);
    const trimmedAmount = amountDollars.trim();
    const amountNum = Number(trimmedAmount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setFormError(t('validationAmount'));
      return;
    }
    if (effectiveLocal.trim() === '') {
      setFormError(t('validationEffective'));
      return;
    }
    const effectiveDate = new Date(effectiveLocal);
    if (Number.isNaN(effectiveDate.getTime())) {
      setFormError(t('validationEffective'));
      return;
    }
    const amountCents = Math.round(amountNum * 100);
    setScheduleLoading(true);
    const res = await managementWebBillingPrices.scheduleBillingPriceChange(
      baseUrl,
      {
        currencyCode: currencyCode.trim().toUpperCase(),
        billingCadence,
        amountCents,
        effectiveFrom: effectiveDate.toISOString(),
        changeReason: scheduleReason.trim() === '' ? null : scheduleReason.trim(),
      },
      null
    );
    setScheduleLoading(false);
    if (!res.ok) {
      setFormError(res.error?.message ?? tErrors('requestFailed'));
      return;
    }
    setFlash(t('scheduleSuccess'));
    setAmountDollars('');
    setScheduleReason('');
    await load();
  };

  const deprecate = async (priceId: number) => {
    setFormError(null);
    setFlash(null);
    setDeprecatingId(priceId);
    const res = await managementWebBillingPrices.deprecateBillingPrice(
      baseUrl,
      priceId,
      { changeReason: deprecateReason.trim() === '' ? null : deprecateReason.trim() },
      null
    );
    setDeprecatingId(null);
    if (!res.ok) {
      setFormError(res.error?.message ?? tErrors('requestFailed'));
      return;
    }
    setFlash(t('deprecateSuccess'));
    setDeprecateReason('');
    await load();
  };

  if (loading) {
    return <Text variant="muted">{tCommon('loading')}</Text>;
  }

  if (loadError !== null) {
    return (
      <Text variant="error" role="alert">
        {loadError}
      </Text>
    );
  }

  return (
    <Stack>
      {flash !== null && (
        <Text variant="muted" role="status">
          {flash}
        </Text>
      )}
      {formError !== null && (
        <Text variant="error" size="sm" as="p" role="alert">
          {formError}
        </Text>
      )}

      <SectionWithHeading title={t('resolvedMembership')}>
        {membership !== null && (
          <Stack>
            <Text>
              {t('freeTrialSeconds')}: {membership.freeTrialExpirationSeconds}
            </Text>
            <Text>
              {t('premiumMonthly')}: {membership.premiumMembershipCostMonthly}
            </Text>
            <Text>
              {t('premiumAnnual')}: {membership.premiumMembershipCostAnnually}
            </Text>
          </Stack>
        )}
      </SectionWithHeading>

      <SectionWithHeading title={t('priceWindows')}>
        <Table.ScrollContainer>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>{t('columnStatus')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnCurrency')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnCadence')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnAmount')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnEffectiveFrom')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnEffectiveTo')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnSource')}</Table.HeaderCell>
                {crudFlags.update ? (
                  <Table.HeaderCell>{t('columnActions')}</Table.HeaderCell>
                ) : null}
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {windows.map((w) => {
                const statusLabel =
                  w.status === 'active'
                    ? t('statusActive')
                    : w.status === 'scheduled'
                      ? t('statusScheduled')
                      : t('statusHistorical');
                const cadenceLabel =
                  w.billingCadence === 'monthly' ? t('cadenceMonthly') : t('cadenceAnnual');
                return (
                  <Table.Row key={w.id}>
                    <Table.Cell>{statusLabel}</Table.Cell>
                    <Table.Cell>{w.currencyCode}</Table.Cell>
                    <Table.Cell>{cadenceLabel}</Table.Cell>
                    <Table.Cell>
                      {formatMajorUnits(locale, w.currencyCode, w.amountCents)}
                    </Table.Cell>
                    <Table.Cell>{formatDateTimeReadable(locale, w.effectiveFrom)}</Table.Cell>
                    <Table.Cell>
                      {w.effectiveTo === null ? '—' : formatDateTimeReadable(locale, w.effectiveTo)}
                    </Table.Cell>
                    <Table.Cell>{w.source}</Table.Cell>
                    {crudFlags.update ? (
                      <Table.Cell>
                        {w.status === 'active' ? (
                          <Button
                            type="button"
                            variant="secondary"
                            loading={deprecatingId === w.id}
                            disabled={deprecatingId !== null}
                            onClick={() => {
                              void deprecate(w.id);
                            }}
                          >
                            {t('deprecate')}
                          </Button>
                        ) : (
                          '—'
                        )}
                      </Table.Cell>
                    ) : null}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </Table.ScrollContainer>
        {crudFlags.update ? (
          <Input
            label={t('deprecateReasonOptional')}
            value={deprecateReason}
            onChange={setDeprecateReason}
            disabled={deprecatingId !== null}
          />
        ) : null}
      </SectionWithHeading>

      <SectionWithHeading title={t('auditLog')}>
        <Table.ScrollContainer>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>{t('columnWhen')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnCurrency')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnCadence')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnAmount')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnReason')}</Table.HeaderCell>
                <Table.HeaderCell>{t('columnActor')}</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {audit.map((a) => {
                const displayAmount =
                  a.newAmountCents !== null
                    ? formatMajorUnits(locale, a.currencyCode ?? 'USD', a.newAmountCents)
                    : a.previousAmountCents !== null
                      ? formatMajorUnits(locale, a.currencyCode ?? 'USD', a.previousAmountCents)
                      : '—';
                return (
                  <Table.Row key={a.id}>
                    <Table.Cell>{formatDateTimeReadable(locale, a.createdAt)}</Table.Cell>
                    <Table.Cell>{a.currencyCode ?? t('unknownCurrency')}</Table.Cell>
                    <Table.Cell>
                      {a.billingCadence === null
                        ? '—'
                        : a.billingCadence === 'monthly'
                          ? t('cadenceMonthly')
                          : t('cadenceAnnual')}
                    </Table.Cell>
                    <Table.Cell>{displayAmount}</Table.Cell>
                    <Table.Cell>{a.changeReason ?? '—'}</Table.Cell>
                    <Table.Cell>{shortId(a.changedByManagementUserId)}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </Table.ScrollContainer>
      </SectionWithHeading>

      {crudFlags.create ? (
        <SectionWithHeading title={t('scheduleHeading')}>
          <FormContainer onSubmit={scheduleSubmit}>
            <Stack>
              <Input
                label={t('currencyCode')}
                value={currencyCode}
                onChange={setCurrencyCode}
                disabled={scheduleLoading}
                maxLength={3}
              />
              <Select
                label={t('billingCadence')}
                options={cadenceOptions}
                value={billingCadence}
                onChange={(v) => {
                  if (v === 'monthly' || v === 'annual') {
                    setBillingCadence(v);
                  }
                }}
                disabled={scheduleLoading}
              />
              <Input
                label={t('amountDollars')}
                value={amountDollars}
                onChange={setAmountDollars}
                disabled={scheduleLoading}
                inputMode="decimal"
              />
              <Input
                type="datetime-local"
                label={t('effectiveFrom')}
                value={effectiveLocal}
                onChange={setEffectiveLocal}
                disabled={scheduleLoading}
              />
              <Input
                label={t('changeReasonOptional')}
                value={scheduleReason}
                onChange={setScheduleReason}
                disabled={scheduleLoading}
              />
              <FormActions>
                <Button
                  type="submit"
                  variant="primary"
                  loading={scheduleLoading}
                  disabled={scheduleLoading}
                >
                  {t('scheduleSubmit')}
                </Button>
              </FormActions>
            </Stack>
          </FormContainer>
        </SectionWithHeading>
      ) : null}
    </Stack>
  );
}
