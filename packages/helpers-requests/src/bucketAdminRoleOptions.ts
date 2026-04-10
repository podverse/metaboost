import type { BucketRoleItem, PredefinedBucketRoleItem } from './management-web/bucketRoles.js';

import { PREDEFINED_BUCKET_ROLES } from '@boilerplate/helpers';

/**
 * Shape of a bucket admin role option for dropdowns (matches @boilerplate/ui BucketAdminRoleOption).
 * Used so helpers-requests does not depend on UI; apps pass this array to BucketAdminsView / EditBucketAdminForm.
 */
export interface BucketAdminRoleOptionShape {
  id: string;
  label: string;
  description?: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
}

export interface BuildBucketAdminRoleOptionsI18n {
  getLabel: (role: BucketRoleItem) => string;
  getDescription: (roleId: string) => string;
}

/**
 * Builds the canonical list of bucket admin role options: predefined roles in PREDEFINED_BUCKET_ROLES
 * order (using API data when present, else synthetic from constant), then custom roles.
 * Use in both web and management-web bucket settings admins so the dropdown cannot diverge.
 */
export function buildBucketAdminRoleOptions(
  apiRoles: BucketRoleItem[],
  i18n: BuildBucketAdminRoleOptionsI18n
): BucketAdminRoleOptionShape[] {
  const predefinedFromApi = apiRoles.filter(
    (r): r is PredefinedBucketRoleItem => r.isPredefined === true
  );
  const customFromApi = apiRoles.filter((r) => r.isPredefined !== true);

  const predefinedOptions: BucketAdminRoleOptionShape[] = PREDEFINED_BUCKET_ROLES.map((predef) => {
    const fromApi = predefinedFromApi.find((r) => r.id === predef.id);
    const role: PredefinedBucketRoleItem =
      fromApi !== undefined
        ? fromApi
        : {
            ...predef,
            isPredefined: true as const,
            createdAt: null,
          };
    return {
      id: role.id,
      label: i18n.getLabel(role),
      description: i18n.getDescription(role.id),
      bucketCrud: role.bucketCrud,
      bucketMessagesCrud: role.bucketMessagesCrud,
      bucketAdminsCrud: role.bucketAdminsCrud,
    };
  });

  const customOptions: BucketAdminRoleOptionShape[] = customFromApi.map((role) => ({
    id: role.id,
    label: i18n.getLabel(role),
    description: i18n.getDescription(role.id),
    bucketCrud: role.bucketCrud,
    bucketMessagesCrud: role.bucketMessagesCrud,
    bucketAdminsCrud: role.bucketAdminsCrud,
  }));

  return [...predefinedOptions, ...customOptions];
}
