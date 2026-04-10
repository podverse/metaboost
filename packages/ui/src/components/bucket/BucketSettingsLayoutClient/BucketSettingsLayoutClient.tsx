'use client';

import { ContentPageLayout } from '@boilerplate/ui';

export type BucketSettingsLayoutClientProps = {
  breadcrumbs: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  contentMaxWidth?: 'readable' | 'form';
};

/**
 * Wraps bucket settings pages with shared layout: breadcrumbs + optional title + children.
 */
export function BucketSettingsLayoutClient({
  breadcrumbs,
  title,
  children,
  contentMaxWidth = 'form',
}: BucketSettingsLayoutClientProps) {
  return (
    <ContentPageLayout breadcrumbs={breadcrumbs} title={title} contentMaxWidth={contentMaxWidth}>
      {children}
    </ContentPageLayout>
  );
}
