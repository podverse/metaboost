'use client';

import { useRouter } from 'next/navigation';

import { SelectMenuDropdown, setMessagesSortInCookie } from '@metaboost/ui';

export type MessagesSortSelectProps = {
  sort: string;
  label: string;
  sortOptionLabels: { recent: string; oldest: string };
  /** When set, messages sort (recent/oldest) is persisted and restored when URL has no sort. */
  sortPrefsCookieName?: string;
  /** When set, called after cookie write instead of router.refresh (async list refresh). */
  onAfterCookieWrite?: () => Promise<void>;
};

export function MessagesSortSelect({
  sort,
  label,
  sortOptionLabels,
  sortPrefsCookieName,
  onAfterCookieWrite,
}: MessagesSortSelectProps) {
  const router = useRouter();
  const value = sort === 'oldest' ? 'oldest' : 'recent';
  const options = [
    { value: 'recent', label: sortOptionLabels.recent },
    { value: 'oldest', label: sortOptionLabels.oldest },
  ];

  const handleChange = (newValue: string) => {
    if (sortPrefsCookieName !== undefined && sortPrefsCookieName.trim() !== '') {
      setMessagesSortInCookie(sortPrefsCookieName, newValue === 'oldest' ? 'oldest' : 'recent');
    }
    void (onAfterCookieWrite !== undefined
      ? onAfterCookieWrite()
      : Promise.resolve(router.refresh()));
  };

  return (
    <SelectMenuDropdown
      options={options}
      value={value}
      onChange={handleChange}
      aria-label={label}
    />
  );
}
