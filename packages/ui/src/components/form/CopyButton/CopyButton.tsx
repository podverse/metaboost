'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { Button, type ButtonVariant } from '../Button';

import styles from './CopyButton.module.scss';

const COPIED_RESET_MS = 2000;

export type CopyButtonProps = {
  /** Text written to the clipboard on successful copy. */
  value: string;
  /** Button label before copy (typically i18n). */
  copyLabel: string;
  /** Label shown inside the button after a successful copy. Defaults to `Copied!`. */
  copiedLabel?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  /** Called after the clipboard write succeeds (after copy, before timer reset). */
  onCopied?: () => void;
  /** Called when clipboard write fails. */
  onCopyError?: () => void;
};

export function CopyButton({
  value,
  copyLabel,
  copiedLabel = 'Copied!',
  variant = 'secondary',
  disabled = false,
  className = '',
  onCopied,
  onCopyError,
}: CopyButtonProps) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [minWidthPx, setMinWidthPx] = useState<number | undefined>(undefined);
  const copyMeasureRef = useRef<HTMLSpanElement>(null);
  const copiedMeasureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const next = Math.max(
      copyMeasureRef.current?.getBoundingClientRect().width ?? 0,
      copiedMeasureRef.current?.getBoundingClientRect().width ?? 0
    );
    if (next > 0) {
      setMinWidthPx(Math.ceil(next));
    }
  }, [copyLabel, copiedLabel]);

  useLayoutEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => {
      setCopied(false);
    }, COPIED_RESET_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [copied]);

  const handleClick = async (): Promise<void> => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
    } catch {
      onCopyError?.();
    } finally {
      setCopying(false);
    }
  };

  const visibleLabel = copied ? copiedLabel : copyLabel;

  return (
    <span className={className}>
      <div className={styles.measureHost} aria-hidden>
        <span ref={copyMeasureRef} className={styles.measureText}>
          {copyLabel}
        </span>
        <span ref={copiedMeasureRef} className={styles.measureText}>
          {copiedLabel}
        </span>
      </div>
      <Button
        type="button"
        variant={variant}
        onClick={() => {
          void handleClick();
        }}
        loading={copying}
        disabled={disabled || copying}
        style={minWidthPx !== undefined ? { minWidth: minWidthPx } : undefined}
        aria-live="polite"
        title={visibleLabel}
      >
        <span className={styles.label}>{visibleLabel}</span>
      </Button>
    </span>
  );
}
