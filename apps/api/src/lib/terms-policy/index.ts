import { TermsVersionService, UserTermsAcceptanceService } from '@metaboost/orm';

export type TermsPolicyPhase = 'pre_announcement' | 'announcement' | 'grace' | 'enforced';

export type TermsPolicyEvaluation = {
  currentVersionId: string;
  currentVersionKey: string;
  announcementStartsAt: Date | null;
  effectiveAt: Date;
  enforcementStartsAt: Date;
  phase: TermsPolicyPhase;
  acceptedCurrent: boolean;
  mustAcceptNow: boolean;
  blockerMessage: string | null;
};

const TERMS_BLOCKER_MESSAGE = 'You must accept the latest terms to continue.';

function computePhase(
  now: Date,
  announcementStartsAt: Date | null,
  effectiveAt: Date,
  enforcementStartsAt: Date
): TermsPolicyPhase {
  if (now.getTime() >= enforcementStartsAt.getTime()) {
    return 'enforced';
  }
  if (announcementStartsAt !== null && now.getTime() < announcementStartsAt.getTime()) {
    return 'pre_announcement';
  }
  if (announcementStartsAt !== null && now.getTime() < effectiveAt.getTime()) {
    return 'announcement';
  }
  return 'grace';
}

export async function evaluateTermsPolicyForUser(
  userId: string,
  now: Date = new Date()
): Promise<TermsPolicyEvaluation> {
  const current = await TermsVersionService.findCurrentOrThrow(now);
  const acceptedCurrent =
    (await UserTermsAcceptanceService.findByUserIdAndTermsVersionId(userId, current.id)) !== null;
  const phase = computePhase(
    now,
    current.announcementStartsAt,
    current.effectiveAt,
    current.enforcementStartsAt
  );
  const mustAcceptNow = phase === 'enforced' && !acceptedCurrent;

  return {
    currentVersionId: current.id,
    currentVersionKey: current.versionKey,
    announcementStartsAt: current.announcementStartsAt,
    effectiveAt: current.effectiveAt,
    enforcementStartsAt: current.enforcementStartsAt,
    phase,
    acceptedCurrent,
    mustAcceptNow,
    blockerMessage: mustAcceptNow ? TERMS_BLOCKER_MESSAGE : null,
  };
}
