'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CheckboxField, Row } from '@metaboost/ui';

import { MessagesSortSelect } from './MessagesSortSelect';

type MessagesHeaderControlsProps = {
  sort: 'recent' | 'oldest';
  basePath: string;
  label: string;
  sortOptionLabels: {
    recent: string;
    oldest: string;
  };
  sortPrefsCookieName: string;
  showUnverifiedMessagesLabel: string;
  includeUnverified: boolean;
  showUnverifiedControl: boolean;
};

export function MessagesHeaderControls({
  sort,
  basePath,
  label,
  sortOptionLabels,
  sortPrefsCookieName,
  showUnverifiedMessagesLabel,
  includeUnverified,
  showUnverifiedControl,
}: MessagesHeaderControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onIncludeUnverifiedChange = (checked: boolean): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'messages');
    if (checked) {
      params.set('includeUnverified', '1');
    } else {
      params.delete('includeUnverified');
    }
    params.delete('page');
    const query = params.toString();
    const href = query === '' ? pathname : `${pathname}?${query}`;
    router.push(href);
  };

  return (
    <Row>
      <MessagesSortSelect
        sort={sort}
        basePath={basePath}
        queryParams={{ tab: 'messages', ...(includeUnverified ? { includeUnverified: '1' } : {}) }}
        label={label}
        sortOptionLabels={sortOptionLabels}
        sortPrefsCookieName={sortPrefsCookieName}
      />
      {showUnverifiedControl ? (
        <CheckboxField
          label={showUnverifiedMessagesLabel}
          checked={includeUnverified}
          onChange={onIncludeUnverifiedChange}
        />
      ) : null}
    </Row>
  );
}
