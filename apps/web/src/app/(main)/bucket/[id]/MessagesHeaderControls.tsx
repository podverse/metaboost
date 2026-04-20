'use client';

import { Row } from '@metaboost/ui';

import { MessagesSortSelect } from './MessagesSortSelect';
import { MessagesViewOptionsGear } from './MessagesViewOptionsGear';

import styles from './MessagesHeaderControls.module.scss';

type MessagesHeaderControlsProps = {
  sort: 'recent' | 'oldest';
  bucketPath: string;
  navCookieName: string;
  includeBlockedSenderMessages: boolean;
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
  bucketPath,
  navCookieName,
  includeBlockedSenderMessages,
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
      <MessagesViewOptionsGear
        bucketPath={bucketPath}
        navCookieName={navCookieName}
        includeBlockedSenderMessages={includeBlockedSenderMessages}
        onAfterCookieWrite={onAfterCookieWrite}
      />
    </Row>
  );
}
