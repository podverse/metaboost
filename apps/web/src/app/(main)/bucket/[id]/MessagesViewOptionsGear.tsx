'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import { isTruthyQueryFlag } from '@metaboost/helpers';
import { Dropdown, DropdownMenuCheckboxRow } from '@metaboost/ui';

export type MessagesViewOptionsGearProps = {
  basePath: string;
};

export function MessagesViewOptionsGear({ basePath }: MessagesViewOptionsGearProps) {
  const t = useTranslations('buckets');
  const router = useRouter();
  const searchParams = useSearchParams();

  const checked = isTruthyQueryFlag(searchParams.get('includeBlockedSenderMessages'));

  const setIncludeBlocked = (next: boolean): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set('includeBlockedSenderMessages', '1');
    } else {
      params.delete('includeBlockedSenderMessages');
    }
    params.set('page', '1');
    const q = params.toString();
    router.push(q !== '' ? `${basePath}?${q}` : basePath);
  };

  return (
    <Dropdown
      aria-label={t('messagesViewOptionsAriaLabel')}
      triggerVariant="iconGhostInlineCaret"
      trigger={<i className="fa-solid fa-gear" aria-hidden />}
      panelContent={
        <DropdownMenuCheckboxRow
          label={t('messagesShowBlockedSenderMessages')}
          checked={checked}
          onChange={setIncludeBlocked}
        />
      }
    />
  );
}
