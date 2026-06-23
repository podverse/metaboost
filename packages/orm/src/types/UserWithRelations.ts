import type { User } from '../entities/User.js';
import type { UserBio } from '../entities/UserBio.js';
import type { UserCredentials } from '../entities/UserCredentials.js';
import type { UserMembership } from '../entities/UserMembership.js';

/**
 * User with credentials and bio relations loaded (e.g. from UserService.findById/findByEmail/create).
 */
export type UserWithRelations = User & {
  credentials: UserCredentials;
  bio: UserBio | null;
  membership: UserMembership | null;
};
