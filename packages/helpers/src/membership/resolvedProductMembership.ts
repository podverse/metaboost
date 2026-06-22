import type { ProductMembershipDefaultsFromEnv } from './productMembershipDefaultsFromEnv.js';

/**
 * Resolved premium membership marketing values (trial length and USD prices), merged from DB
 * catalog and env bootstrap.
 */
export type ResolvedProductMembership = ProductMembershipDefaultsFromEnv;
