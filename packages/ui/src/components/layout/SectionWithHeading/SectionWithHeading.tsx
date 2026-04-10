import type { ReactNode } from 'react';

import { Stack } from '../Stack';

import styles from './SectionWithHeading.module.scss';

export type SectionWithHeadingProps = {
  /** Section heading (e.g. "Profile information", "Change password"). Rendered as an h2 with Card-title-style sizing. */
  title: ReactNode;
  /** Optional action (e.g. button) shown on the same row as the title, aligned to the end. */
  headingAction?: ReactNode;
  /** Content below the heading. */
  children: ReactNode;
  className?: string;
};

/**
 * Wrapper for a page section: an h2 heading (styled like former Card titles) and content below.
 * Use for profile sections, form blocks, and any place that needs a small section heading + content without a card.
 * When headingAction is set, the title and action are on one row (title left, action right).
 */
export function SectionWithHeading({
  title,
  headingAction,
  children,
  className = '',
}: SectionWithHeadingProps) {
  return (
    <section className={`${styles.root} ${className}`.trim()}>
      <div className={styles.headingRow}>
        <h2 className={styles.title}>{title}</h2>
        {headingAction !== undefined && headingAction !== null && (
          <div className={styles.headingAction}>{headingAction}</div>
        )}
      </div>
      <Stack>{children}</Stack>
    </section>
  );
}
