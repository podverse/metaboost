/**
 * Canonical event action strings for management events.
 * Use these when recording events so actions stay consistent and discoverable.
 */
export const EVENT_ACTIONS = {
  admin: {
    created: 'admin_created',
    updated: 'admin_updated',
    deleted: 'admin_deleted',
    passwordChanged: 'password_changed',
  },
  user: {
    created: 'user_created',
    updated: 'user_updated',
    deleted: 'user_deleted',
    passwordChanged: 'user_password_changed',
  },
} as const;

/**
 * Canonical target type strings for management events.
 * Use these when recording events so targetType stays consistent and discoverable.
 */
export const EVENT_TARGET_TYPES = {
  admin: 'admin',
  user: 'user',
} as const;
