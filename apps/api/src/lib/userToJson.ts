import type { TermsPolicyPhase } from './terms-policy/index.js';
import type { UserWithRelations } from '@metaboost/orm';

/**
 * Safe shape for user in API responses. Only these fields may be returned.
 * Never include credentials (e.g. passwordHash).
 * Email and username are optional (at least one is set in DB; legacy or username-only users).
 */
export interface PublicUser {
  id: string;
  idText: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  preferredCurrency: string | null;
  termsAcceptedAt: string | null;
  acceptedTermsEnforcementStartsAt: string | null;
  termsEnforcementStartsAt: string;
  hasAcceptedLatestTerms: boolean;
  currentTermsVersionKey: string;
  termsPolicyPhase: TermsPolicyPhase;
  acceptedCurrentTerms: boolean;
  mustAcceptTermsNow: boolean;
  termsBlockerMessage: string | null;
  acceptedUpcomingTerms: boolean;
  needsUpcomingTermsAcceptance: boolean;
  upcomingTermsAcceptanceBy: string | null;
  currentTerms: PublicTermsVersion;
  upcomingTerms: PublicTermsVersion | null;
  acceptedTerms: PublicTermsVersion | null;
}

export interface PublicTermsVersion {
  id: string;
  versionKey: string;
  title: string;
  contentText: string;
  announcementStartsAt: string | null;
  enforcementStartsAt: string;
  status: string;
}

/**
 * Non-PII shape for returning *another* user (e.g. bucket admins list). Use this when the
 * response describes a user other than the authenticated user. Email must not be returned
 * for other users. Username and displayName are safe to return for identity in lists/details.
 */
export interface PublicUserSummary {
  id: string;
  idText: string;
  username: string | null;
  displayName: string | null;
}

/**
 * Serialize user for self endpoints (login, me, signup, refresh, etc.). Returns safe
 * fields including email/username (PII allowed only for the authenticated user).
 */
export function userToJson(
  user: UserWithRelations,
  options: {
    currentTerms: {
      id: string;
      versionKey: string;
      title: string;
      contentText: string;
      announcementStartsAt: Date | null;
      enforcementStartsAt: Date;
      status: string;
    };
    upcomingTerms: {
      id: string;
      versionKey: string;
      title: string;
      contentText: string;
      announcementStartsAt: Date | null;
      enforcementStartsAt: Date;
      status: string;
    } | null;
    acceptedTerms: {
      id: string;
      versionKey: string;
      title: string;
      contentText: string;
      announcementStartsAt: Date | null;
      enforcementStartsAt: Date;
      status: string;
    } | null;
    acceptedAt: Date | null;
    acceptedTermsEnforcementStartsAt: Date | null;
    termsEnforcementStartsAt: Date;
    hasAcceptedLatestTerms: boolean;
    currentTermsVersionKey: string;
    termsPolicyPhase: TermsPolicyPhase;
    acceptedCurrentTerms: boolean;
    acceptedUpcomingTerms: boolean;
    needsUpcomingTermsAcceptance: boolean;
    upcomingTermsAcceptanceBy: Date | null;
    mustAcceptTermsNow: boolean;
    termsBlockerMessage: string | null;
  }
): PublicUser {
  const currentTerms: PublicTermsVersion = {
    id: options.currentTerms.id,
    versionKey: options.currentTerms.versionKey,
    title: options.currentTerms.title,
    contentText: options.currentTerms.contentText,
    announcementStartsAt: options.currentTerms.announcementStartsAt?.toISOString() ?? null,
    enforcementStartsAt: options.currentTerms.enforcementStartsAt.toISOString(),
    status: options.currentTerms.status,
  };
  const upcomingTerms: PublicTermsVersion | null =
    options.upcomingTerms === null
      ? null
      : {
          id: options.upcomingTerms.id,
          versionKey: options.upcomingTerms.versionKey,
          title: options.upcomingTerms.title,
          contentText: options.upcomingTerms.contentText,
          announcementStartsAt: options.upcomingTerms.announcementStartsAt?.toISOString() ?? null,
          enforcementStartsAt: options.upcomingTerms.enforcementStartsAt.toISOString(),
          status: options.upcomingTerms.status,
        };
  const acceptedTerms: PublicTermsVersion | null =
    options.acceptedTerms === null
      ? null
      : {
          id: options.acceptedTerms.id,
          versionKey: options.acceptedTerms.versionKey,
          title: options.acceptedTerms.title,
          contentText: options.acceptedTerms.contentText,
          announcementStartsAt: options.acceptedTerms.announcementStartsAt?.toISOString() ?? null,
          enforcementStartsAt: options.acceptedTerms.enforcementStartsAt.toISOString(),
          status: options.acceptedTerms.status,
        };

  return {
    id: user.id,
    idText: user.idText,
    email: user.credentials.email ?? null,
    username: user.credentials.username ?? null,
    displayName: user.bio?.displayName ?? null,
    preferredCurrency: user.bio?.preferredCurrency ?? null,
    termsAcceptedAt: options.acceptedAt?.toISOString() ?? null,
    acceptedTermsEnforcementStartsAt:
      options.acceptedTermsEnforcementStartsAt?.toISOString() ?? null,
    termsEnforcementStartsAt: options.termsEnforcementStartsAt.toISOString(),
    hasAcceptedLatestTerms: options.hasAcceptedLatestTerms,
    currentTermsVersionKey: options.currentTermsVersionKey,
    termsPolicyPhase: options.termsPolicyPhase,
    acceptedCurrentTerms: options.acceptedCurrentTerms,
    acceptedUpcomingTerms: options.acceptedUpcomingTerms,
    needsUpcomingTermsAcceptance: options.needsUpcomingTermsAcceptance,
    upcomingTermsAcceptanceBy: options.upcomingTermsAcceptanceBy?.toISOString() ?? null,
    mustAcceptTermsNow: options.mustAcceptTermsNow,
    termsBlockerMessage: options.termsBlockerMessage,
    currentTerms,
    upcomingTerms,
    acceptedTerms,
  };
}

/**
 * Serialize user for responses that describe *another* user. Omits email so PII is never
 * returned for other users while keeping username/displayName available for UI identity.
 */
export function userToPublicSummary(user: UserWithRelations): PublicUserSummary {
  return {
    id: user.id,
    idText: user.idText,
    username: user.credentials.username ?? null,
    displayName: user.bio?.displayName ?? null,
  };
}
