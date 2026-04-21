import type { AuthTermsVersionPayload } from '../lib/auth-user';

import { Fragment } from 'react';

import { SectionWithHeading, Stack, Text } from '@metaboost/ui';

import styles from './TermsVersionCard.module.scss';

type TermsVersionCardProps = {
  /** When set, wraps content in {@link SectionWithHeading}. Omit on pages that already provide the main title (e.g. terms-required). */
  heading?: string;
  terms: AuthTermsVersionPayload;
  subtitle?: string;
};

function renderLineWithBold(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`text-${index}`}>{part}</Fragment>;
  });
}

export function TermsVersionCard({ heading, terms, subtitle }: TermsVersionCardProps) {
  const inner = (
    <Stack>
      {subtitle !== undefined && subtitle !== '' ? <Text>{subtitle}</Text> : null}
      <div className={styles.contentBlock}>
        {terms.contentText.split('\n').map((line, index) => (
          <p key={`terms-line-${index}`} className={styles.contentParagraph}>
            {line === '' ? <br /> : renderLineWithBold(line)}
          </p>
        ))}
      </div>
    </Stack>
  );

  if (heading !== undefined && heading !== '') {
    return <SectionWithHeading title={heading}>{inner}</SectionWithHeading>;
  }

  return inner;
}
