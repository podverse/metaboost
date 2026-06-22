import type { BreadcrumbItem } from '@metaboost/ui';

import { ROUTES } from './routes';

/** Prepends a link to the management Dashboard as the first breadcrumb segment. */
export function withDashboardBreadcrumb(
  dashboardLabel: string,
  items: BreadcrumbItem[]
): BreadcrumbItem[] {
  return [{ label: dashboardLabel, href: ROUTES.DASHBOARD }, ...items];
}
