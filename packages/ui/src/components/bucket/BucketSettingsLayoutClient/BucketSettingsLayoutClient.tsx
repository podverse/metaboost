'use client';

import { ContentPageLayout } from '@metaboost/ui';

export type BucketSettingsLayoutClientProps = {
  breadcrumbs: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  contentMaxWidth?: 'readable' | 'form';
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
  fullWidthBelow,
}: BucketSettingsLayoutClientProps) {
  return (
    <ContentPageLayout
      breadcrumbs={breadcrumbs}
      title={title}
      contentMaxWidth={contentMaxWidth}
      fullWidthBelow={fullWidthBelow}
    >
      {children}
    </ContentPageLayout>
  );
}
