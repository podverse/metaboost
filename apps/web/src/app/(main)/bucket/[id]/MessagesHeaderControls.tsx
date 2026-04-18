'use client';

import { Row } from '@metaboost/ui';

import { MessagesSortSelect } from './MessagesSortSelect';
import { MessagesViewOptionsGear } from './MessagesViewOptionsGear';

import styles from './MessagesHeaderControls.module.scss';

type MessagesHeaderControlsProps = {
  sort: 'recent' | 'oldest';
  basePath: string;
  label: string;
  sortOptionLabels: {
    recent: string;
    oldest: string;
  };
  sortPrefsCookieName: string;
};

export function MessagesHeaderControls({
  sort,
  basePath,
  label,
  sortOptionLabels,
  sortPrefsCookieName,
}: MessagesHeaderControlsProps) {
  return (
    <Row className={styles.controlsRow}>
      <MessagesSortSelect
        sort={sort}
        basePath={basePath}
        queryParams={{ tab: 'messages' }}
        label={label}
        sortOptionLabels={sortOptionLabels}
        sortPrefsCookieName={sortPrefsCookieName}
      />
      <MessagesViewOptionsGear basePath={basePath} />
    </Row>
  );
}
