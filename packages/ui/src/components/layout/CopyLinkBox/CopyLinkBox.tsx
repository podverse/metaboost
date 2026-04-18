'use client';

import type { ReactNode } from 'react';

import { CopyButton } from '../../form/CopyButton';
import { Text } from '../Text';

import styles from './CopyLinkBox.module.scss';

export type CopyLinkBoxProps = {
  /** The link value to display and copy. */
  value: string;
  /** Optional description shown above the input (e.g. "Copy this link to invite..."). */
  description?: ReactNode;
  /** Label for the copy button when not copied. */
  copyLabel?: string;
  /** Label for the copy button after a successful copy. */
  copiedLabel?: string;
  /** Accessible label for the read-only input. */
  inputAriaLabel?: string;
  /** Optional class name for the root. */
  className?: string;
};

/**
 * A box that shows a read-only link and a copy button.
 */
export function CopyLinkBox({
  value,
  description,
  copyLabel = 'Copy',
  copiedLabel,
  inputAriaLabel,
  className = '',
}: CopyLinkBoxProps) {
  return (
    <div className={`${styles.root} ${className}`.trim()}>
      {description !== undefined && (
        <Text size="sm" variant="muted" as="p" className={styles.description}>
          {description}
        </Text>
      )}
      <div className={styles.row}>
        <input
          type="text"
          readOnly
          value={value}
          className={styles.input}
          aria-label={inputAriaLabel ?? copyLabel}
        />
        <CopyButton value={value} copyLabel={copyLabel} copiedLabel={copiedLabel} />
      </div>
    </div>
  );
}
