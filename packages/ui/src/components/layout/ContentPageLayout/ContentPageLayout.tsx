import type { ReactNode } from 'react';

import { Container } from '../Container';
import { PageHeader } from '../PageHeader';
import { Stack } from '../Stack';
import { Text } from '../Text';

export type ContentPageLayoutProps = {
  /** Page title (e.g. "Profile", "Settings"). Rendered as an h1 via PageHeader. Omit to hide the header (e.g. when the page renders its own). */
  title?: ReactNode;
  /** Optional breadcrumbs rendered above the page header. */
  breadcrumbs?: ReactNode;
  /** Optional error message shown above children when present. */
  error?: string | null;
  /** Variant for the error message. Default "muted". */
  errorVariant?: 'muted' | 'error';
  /** When set, constrains content max-width: "readable" (e.g. message lists), "form" (form width, aligns with FormContainer). Passed to Container. */
  contentMaxWidth?: 'readable' | 'form';
  /** Main content below the header. */
  children: ReactNode;
  /**
   * Optional block rendered below the max-width column, in a second full-width container
   * (same page horizontal padding, no max-width on inner stack).
   */
  fullWidthBelow?: ReactNode;
};

/**
 * Standard layout for content pages with a page header and no table: Container > Stack > PageHeader + optional error + children.
 * Use for profile, settings, and any other page that shows a PageHeader and content (forms, cards) without a filter table.
 * Pass contentMaxWidth="form" or contentMaxWidth="readable" to constrain content width.
 */
export function ContentPageLayout({
  title,
  breadcrumbs,
  error,
  errorVariant = 'muted',
  contentMaxWidth,
  children,
  fullWidthBelow,
}: ContentPageLayoutProps) {
  return (
    <>
      <Container contentMaxWidth={contentMaxWidth}>
        {breadcrumbs}
        {title !== undefined && title !== null && <PageHeader title={title} />}
        {error !== undefined && error !== null && error !== '' && (
          <Text variant={errorVariant} role="alert">
            {error}
          </Text>
        )}
        <Stack>{children}</Stack>
      </Container>
      {fullWidthBelow != null && <Container>{fullWidthBelow}</Container>}
    </>
  );
}
