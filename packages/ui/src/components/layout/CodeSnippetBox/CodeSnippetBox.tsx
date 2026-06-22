'use client';

import type { ReactNode } from 'react';

import { useState } from 'react';

import { CopyButton } from '../../form/CopyButton/index';
import { Row } from '../Row/index';
import { Text } from '../Text/index';

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
  copiedLabel,
  copyFailedLabel = 'Copy failed',
  codeAriaLabel,
  className = '',
}: CodeSnippetBoxProps) {
  const [copyError, setCopyError] = useState<string | null>(null);

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
        <CopyButton
          value={value}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          onCopied={() => setCopyError(null)}
          onCopyError={() => setCopyError(copyFailedLabel)}
        />
        {copyError !== null ? (
          <Text as="p" size="sm" variant="error">
            {copyError}
          </Text>
        ) : null}
      </Row>
    </div>
  );
}
