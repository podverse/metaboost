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
  /** When set, constrains width: "readable" (e.g. message lists), "form" (form width). */
  contentMaxWidth?: 'readable' | 'form';
  /**
   * When true with contentMaxWidth, breadcrumbs/header/error and fullWidthAboveConstrained use the full padded width; only children are limited to contentMaxWidth.
   * When false (default), the entire column including breadcrumbs and title shares contentMaxWidth (legacy behavior).
   */
  constrainMainOnly?: boolean;
  /** With constrainMainOnly: full-width row for tab navigation above the constrained body. */
  fullWidthAboveConstrained?: ReactNode;
  /** Main content below the header. */
  children: ReactNode;
  /**
   * Optional block rendered below the max-width column, in a second full-width container
   * (same page horizontal padding, no max-width on inner stack).
   */
  fullWidthBelow?: ReactNode;
};

/**
 * Standard layout for content pages with a page header and no table.
 * Pass contentMaxWidth to limit width; use constrainMainOnly + fullWidthAboveConstrained for tab strips above a form-width body.
 */
export function ContentPageLayout({
  title,
  breadcrumbs,
  error,
  errorVariant = 'muted',
  contentMaxWidth,
  constrainMainOnly = false,
  fullWidthAboveConstrained,
  children,
  fullWidthBelow,
}: ContentPageLayoutProps) {
  const errorNode =
    error !== undefined && error !== null && error !== '' ? (
      <Text variant={errorVariant} role="alert">
        {error}
      </Text>
    ) : null;
  const titleNode = title !== undefined && title !== null ? <PageHeader title={title} /> : null;

  const mainColumn =
    contentMaxWidth !== undefined ? (
      <Stack maxWidth={contentMaxWidth}>{children}</Stack>
    ) : (
      <Stack>{children}</Stack>
    );

  const useSplitChrome = contentMaxWidth !== undefined && constrainMainOnly === true;

  return (
    <>
      {useSplitChrome ? (
        <Container>
          <Stack>
            <Stack>
              {breadcrumbs}
              {titleNode}
              {errorNode}
              {fullWidthAboveConstrained}
            </Stack>
            {mainColumn}
          </Stack>
        </Container>
      ) : (
        <Container contentMaxWidth={contentMaxWidth}>
          {breadcrumbs}
          {titleNode}
          {errorNode}
          {fullWidthAboveConstrained}
          <Stack>{children}</Stack>
        </Container>
      )}
      {fullWidthBelow !== undefined && fullWidthBelow !== null && (
        <Container>{fullWidthBelow}</Container>
      )}
    </>
  );
}
