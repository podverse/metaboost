'use client';

import type { ReactNode } from 'react';

import { useState } from 'react';

import { Button } from '../../form/Button';
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
 * A box that shows a read-only link and a copy button. Manages copied state and clipboard write internally.
 */
export function CopyLinkBox({
  value,
  description,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  inputAriaLabel,
  className = '',
}: CopyLinkBoxProps) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Caller can optionally listen for errors via a future onCopyError prop if needed.
    } finally {
      setCopying(false);
    }
  };

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
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          loading={copying}
          disabled={copying}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
    </div>
  );
}
