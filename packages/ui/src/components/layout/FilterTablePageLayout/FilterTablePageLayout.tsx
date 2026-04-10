import type { ReactNode } from 'react';

import { Container } from '../Container';
import { PageHeader } from '../PageHeader';
import { Text } from '../Text';

export type FilterTablePageLayoutProps = {
  /** Page title (e.g. "Buckets", "Users"). Rendered as an h1 via PageHeader. */
  title: ReactNode;
  /** Optional error message shown above children when present. */
  error?: string | null;
  /** Variant for the error message. Default "muted". */
  errorVariant?: 'muted' | 'error';
  /** Main content: typically a filter table (ResourceTableWithFilter or app-specific wrapper). */
  children: ReactNode;
};

/**
 * Standard layout for list pages that use a filter table: Container > Stack > PageHeader + optional error + children.
 * Use for buckets, users, admins, and any other page that shows a PageHeader and a ResourceTableWithFilter.
 */
export function FilterTablePageLayout({
  title,
  error,
  errorVariant = 'muted',
  children,
}: FilterTablePageLayoutProps) {
  return (
    <Container>
      <PageHeader title={title} />
      {error !== undefined && error !== null && error !== '' && (
        <Text variant={errorVariant} role="alert">
          {error}
        </Text>
      )}
      {children}
    </Container>
  );
}
