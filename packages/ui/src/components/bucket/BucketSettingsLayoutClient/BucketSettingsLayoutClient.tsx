'use client';

import { ContentPageLayout } from '@metaboost/ui';

export type BucketSettingsLayoutClientProps = {
  breadcrumbs: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  contentMaxWidth?: 'readable' | 'form';
  /** When true (default), tab strip and header row are full padded width; children stay form/readable width. */
  constrainMainOnly?: boolean;
  /** Full-width row with tab nav (same horizontal padding as page, not form max-width). */
  fullWidthAboveConstrained?: React.ReactNode;
  /** Passed through to ContentPageLayout (e.g. full-width table below the form-width column). */
  fullWidthBelow?: React.ReactNode;
};

/**
 * Wraps bucket settings pages with shared layout: breadcrumbs + optional title + children.
 */
export function BucketSettingsLayoutClient({
  breadcrumbs,
  title,
  children,
  contentMaxWidth = 'form',
  constrainMainOnly = true,
  fullWidthAboveConstrained,
  fullWidthBelow,
}: BucketSettingsLayoutClientProps) {
  return (
    <ContentPageLayout
      breadcrumbs={breadcrumbs}
      title={title}
      contentMaxWidth={contentMaxWidth}
      constrainMainOnly={constrainMainOnly}
      fullWidthAboveConstrained={fullWidthAboveConstrained}
      fullWidthBelow={fullWidthBelow}
    >
      {children}
    </ContentPageLayout>
  );
}
