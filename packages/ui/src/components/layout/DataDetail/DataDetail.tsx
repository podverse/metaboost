import type { ReactNode } from 'react';

import { Text } from '../Text';

import styles from './DataDetail.module.scss';

export type DataDetailItem = {
  /** Field label (e.g. "Public", "Bucket admins"). */
  label: ReactNode;
  /** Field value (e.g. "Yes", list of names). */
  value: ReactNode;
};

export type DataDetailProps = {
  /** List of label/value pairs. Each is rendered on its own line with spacing between. */
  items: DataDetailItem[];
};

/**
 * Renders a simple list of properties with line breaks between each field.
 * Use for read-only detail views (e.g. public yes/no, bucket admins).
 */
export function DataDetail({ items }: DataDetailProps) {
  if (items.length === 0) return null;
  return (
    <div className={styles.root}>
      {items.map((item, index) => (
        <div key={index} className={styles.row}>
          <Text variant="muted">
            {item.label}: {item.value}
          </Text>
        </div>
      ))}
    </div>
  );
}
