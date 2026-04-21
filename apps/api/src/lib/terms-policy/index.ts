import { TermsVersionService, UserTermsAcceptanceService } from '@metaboost/orm';

export type TermsPolicyPhase = 'pre_announcement' | 'announcement' | 'enforced';

export type TermsPolicyEvaluation = {
  currentVersionId: string;
  currentVersionKey: string;
  currentVersionTitle: string;
  currentVersionContentText: string;
  currentAnnouncementStartsAt: Date | null;
  currentEnforcementStartsAt: Date;
  announcementStartsAt: Date | null;
  enforcementStartsAt: Date;
  upcomingVersionId: string | null;
  upcomingVersionKey: string | null;
  upcomingVersionTitle: string | null;
  upcomingVersionContentText: string | null;
  upcomingAnnouncementStartsAt: Date | null;
  upcomingEnforcementStartsAt: Date | null;
  phase: TermsPolicyPhase;
  acceptedCurrent: boolean;
  acceptedUpcoming: boolean;
  needsUpcomingAcceptance: boolean;
  upcomingAcceptanceDeadline: Date | null;
  mustAcceptNow: boolean;
  blockerMessage: string | null;
};

function normalizeTermsLocale(locale: string): 'en-US' | 'es' {
  return locale === 'es' ? 'es' : 'en-US';
}

const TERMS_BLOCKER_MESSAGE = 'You must accept the latest terms to continue.';

function computePhase(
  now: Date,
  announcementStartsAt: Date | null,
  enforcementStartsAt: Date
): TermsPolicyPhase {
  if (now.getTime() >= enforcementStartsAt.getTime()) {
    return 'enforced';
  }
  if (announcementStartsAt !== null && now.getTime() < announcementStartsAt.getTime()) {
    return 'pre_announcement';
  }
  return 'announcement';
}

export async function evaluateTermsPolicyForUser(
  userId: string,
  now: Date = new Date(),
  locale: string = 'en-US'
): Promise<TermsPolicyEvaluation> {
  await TermsVersionService.rolloverIfEnforcementPassed(now);
  const normalizedLocale = normalizeTermsLocale(locale);
  const current = await TermsVersionService.findCurrentOrThrow(now);
  const upcoming = await TermsVersionService.findUpcoming(now);
  const acceptedCurrent =
    (await UserTermsAcceptanceService.findByUserIdAndTermsVersionId(userId, current.id)) !== null;
  const acceptedUpcoming =
    upcoming !== null &&
    (await UserTermsAcceptanceService.findByUserIdAndTermsVersionId(userId, upcoming.id)) !== null;

  const policyVersion = upcoming ?? current;
  const phase = computePhase(
    now,
    policyVersion.announcementStartsAt,
    policyVersion.enforcementStartsAt
  );
  const hasAcceptedSupersedingUpcoming = upcoming !== null && acceptedUpcoming;
  const hasComplianceDebt = !acceptedCurrent && !hasAcceptedSupersedingUpcoming;
  const needsUpcomingAcceptance = upcoming !== null ? !acceptedUpcoming : !acceptedCurrent;
  const mustAcceptNow =
    hasComplianceDebt || (upcoming !== null && phase === 'enforced' && !acceptedUpcoming);

  return {
    currentVersionId: current.id,
    currentVersionKey: current.versionKey,
    currentVersionTitle: current.title,
    currentVersionContentText: TermsVersionService.getLocalizedContent(current, normalizedLocale),
    currentAnnouncementStartsAt: current.announcementStartsAt,
    currentEnforcementStartsAt: current.enforcementStartsAt,
    announcementStartsAt: policyVersion.announcementStartsAt,
    enforcementStartsAt: policyVersion.enforcementStartsAt,
    upcomingVersionId: upcoming?.id ?? null,
    upcomingVersionKey: upcoming?.versionKey ?? null,
    upcomingVersionTitle: upcoming?.title ?? null,
    upcomingVersionContentText:
      upcoming === null
        ? null
        : TermsVersionService.getLocalizedContent(upcoming, normalizedLocale),
    upcomingAnnouncementStartsAt: upcoming?.announcementStartsAt ?? null,
    upcomingEnforcementStartsAt: upcoming?.enforcementStartsAt ?? null,
    phase,
    acceptedCurrent,
    acceptedUpcoming,
    needsUpcomingAcceptance,
    upcomingAcceptanceDeadline:
      upcoming?.enforcementStartsAt ?? (mustAcceptNow ? current.enforcementStartsAt : null),
    mustAcceptNow,
    blockerMessage: mustAcceptNow ? TERMS_BLOCKER_MESSAGE : null,
  };
}
