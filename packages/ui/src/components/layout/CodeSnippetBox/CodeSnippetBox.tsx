'use client';

import type { ReactNode } from 'react';

import { useState } from 'react';

import { Button } from '../../form/Button';
import { Row } from '../Row';
import { Text } from '../Text';

import styles from './CodeSnippetBox.module.scss';

export type CodeSnippetBoxProps = {
  value: string;
  description?: ReactNode;
  copyLabel?: string;
  copiedLabel?: string;
  copyFailedLabel?: string;
  codeAriaLabel?: string;
  className?: string;
};

export function CodeSnippetBox({
  value,
  description,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  copyFailedLabel = 'Copy failed',
  codeAriaLabel,
  className = '',
}: CodeSnippetBoxProps) {
  const [copying, setCopying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'muted' | 'error'; message: string } | null>(
    null
  );

  const handleCopy = async (): Promise<void> => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(value);
      setFeedback({ type: 'muted', message: copiedLabel });
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback({ type: 'error', message: copyFailedLabel });
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      {description !== undefined ? (
        <Text size="sm" as="p" className={styles.description}>
          {description}
        </Text>
      ) : null}
      <pre className={styles.pre}>
        <code aria-label={codeAriaLabel}>{value}</code>
      </pre>
      <Row className={styles.actionsRow}>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          loading={copying}
          disabled={copying}
        >
          {copyLabel}
        </Button>
        {feedback !== null ? (
          <Text as="p" size="sm" variant={feedback.type}>
            {feedback.message}
          </Text>
        ) : null}
      </Row>
    </div>
  );
}
