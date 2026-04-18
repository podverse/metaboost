'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Dropdown, DropdownMenuCheckboxRow, mergeBucketDetailNavInCookie } from '@metaboost/ui';

export type MessagesViewOptionsGearProps = {
  bucketPath: string;
  navCookieName: string;
  includeBlockedSenderMessages: boolean;
  /** When set, called after cookie write instead of router.refresh. */
  onAfterCookieWrite?: () => Promise<void>;
};

export function MessagesViewOptionsGear({
  bucketPath,
  navCookieName,
  includeBlockedSenderMessages,
  onAfterCookieWrite,
}: MessagesViewOptionsGearProps) {
  const t = useTranslations('buckets');
  const router = useRouter();

  const setIncludeBlocked = (next: boolean): void => {
    mergeBucketDetailNavInCookie(navCookieName, bucketPath, {
      includeBlockedSenderMessages: next,
      messagesPage: 1,
    });
    void (onAfterCookieWrite !== undefined
      ? onAfterCookieWrite()
      : Promise.resolve(router.refresh()));
  };

  return (
    <Dropdown
      aria-label={t('messagesViewOptionsAriaLabel')}
      triggerVariant="iconGhostInlineCaret"
      trigger={<i className="fa-solid fa-gear" aria-hidden />}
      panelContent={
        <DropdownMenuCheckboxRow
          label={t('messagesShowBlockedSenderMessages')}
          checked={includeBlockedSenderMessages}
          onChange={setIncludeBlocked}
        />
      }
    />
  );
}
