'use client';

import { Row } from '@metaboost/ui';

import { MessagesSortSelect } from './MessagesSortSelect';

import styles from './MessagesHeaderControls.module.scss';

type MessagesHeaderControlsProps = {
  sort: 'recent' | 'oldest';
  label: string;
  sortOptionLabels: {
    recent: string;
    oldest: string;
  };
  sortPrefsCookieName: string;
  onAfterCookieWrite?: () => Promise<void>;
};

export function MessagesHeaderControls({
  sort,
  label,
  sortOptionLabels,
  sortPrefsCookieName,
  onAfterCookieWrite,
}: MessagesHeaderControlsProps) {
  return (
    <Row className={styles.controlsRow}>
      <MessagesSortSelect
        sort={sort}
        label={label}
        sortOptionLabels={sortOptionLabels}
        sortPrefsCookieName={sortPrefsCookieName}
        onAfterCookieWrite={onAfterCookieWrite}
      />
    </Row>
  );
}
