type EventVisibility = 'own' | 'all_admins' | 'all';

export const PREDEFINED_MANAGEMENT_ADMIN_ROLE_IDS = [
  'everything',
  'read_everything',
  'users_full',
  'bucket_full',
  'bucket_read',
] as const;

export type PredefinedManagementAdminRoleId = (typeof PREDEFINED_MANAGEMENT_ADMIN_ROLE_IDS)[number];

export type PredefinedManagementAdminRole = {
  id: PredefinedManagementAdminRoleId;
  nameKey: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
};

export const PREDEFINED_MANAGEMENT_ADMIN_ROLES: PredefinedManagementAdminRole[] = [
  {
    id: 'everything',
    nameKey: 'roles.everything',
    adminsCrud: 15,
    usersCrud: 15,
    bucketsCrud: 15,
    bucketMessagesCrud: 15,
    bucketAdminsCrud: 15,
    eventVisibility: 'all',
  },
  {
    id: 'read_everything',
    nameKey: 'roles.readEverything',
    adminsCrud: 2,
    usersCrud: 2,
    bucketsCrud: 2,
    bucketMessagesCrud: 2,
    bucketAdminsCrud: 2,
    eventVisibility: 'all_admins',
  },
  {
    id: 'users_full',
    nameKey: 'roles.usersFull',
    adminsCrud: 0,
    usersCrud: 15,
    bucketsCrud: 15,
    bucketMessagesCrud: 15,
    bucketAdminsCrud: 15,
    eventVisibility: 'all_admins',
  },
  {
    id: 'bucket_full',
    nameKey: 'roles.bucketFull',
    adminsCrud: 0,
    usersCrud: 0,
    bucketsCrud: 15,
    bucketMessagesCrud: 15,
    bucketAdminsCrud: 15,
    eventVisibility: 'all_admins',
  },
  {
    id: 'bucket_read',
    nameKey: 'roles.bucketRead',
    adminsCrud: 0,
    usersCrud: 0,
    bucketsCrud: 2,
    bucketMessagesCrud: 2,
    bucketAdminsCrud: 2,
    eventVisibility: 'all_admins',
  },
];

export function getPredefinedManagementAdminRoleById(
  id: string
): PredefinedManagementAdminRole | undefined {
  return PREDEFINED_MANAGEMENT_ADMIN_ROLES.find((role) => role.id === id);
}
