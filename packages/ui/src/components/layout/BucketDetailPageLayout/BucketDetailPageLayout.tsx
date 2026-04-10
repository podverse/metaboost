import type { ReactNode } from 'react';

import { ContentPageLayout } from '../ContentPageLayout';

export type BucketDetailPageLayoutProps = {
  /** Optional breadcrumbs rendered above the content. */
  breadcrumbs?: ReactNode;
  /** Main content (e.g. BucketDetailContent). */
  children: ReactNode;
};

/**
 * Single place for bucket detail page layout. Used by apps/web and apps/management-web
 * so width and structure stay in sync. Content is full width (no contentMaxWidth).
 * Each app still passes its own hrefs into the content (web vs management-web domains;
 * public page link is built by the app to point at the web public page when needed).
 */
export function BucketDetailPageLayout({ breadcrumbs, children }: BucketDetailPageLayoutProps) {
  return <ContentPageLayout breadcrumbs={breadcrumbs}>{children}</ContentPageLayout>;
}
