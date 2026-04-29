export type TermsPolicyPhase = 'pre_announcement' | 'announcement' | 'enforced';

export type TermsVersionStatus = 'draft' | 'upcoming' | 'current' | 'deprecated';

export type AuthTermsVersionPayload = {
  id: string;
  versionKey: string;
  title: string;
  contentText: string;
  announcementStartsAt: string | null;
  enforcementStartsAt: string;
  status: TermsVersionStatus;
};

export type AuthUserPayload = {
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
  acceptedUpcomingTerms: boolean;
  needsUpcomingTermsAcceptance: boolean;
  upcomingTermsAcceptanceBy: string | null;
  mustAcceptTermsNow: boolean;
  termsBlockerMessage: string | null;
  currentTerms: AuthTermsVersionPayload;
  upcomingTerms: AuthTermsVersionPayload | null;
  acceptedTerms: AuthTermsVersionPayload | null;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseOptionalStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'string' ? value : null;
}

function parseTermsPolicyPhase(value: unknown): TermsPolicyPhase | null {
  if (value === 'pre_announcement' || value === 'announcement' || value === 'enforced') {
    return value;
  }
  return null;
}

function parseTermsVersionStatus(value: unknown): TermsVersionStatus | null {
  if (value === 'draft' || value === 'upcoming' || value === 'current' || value === 'deprecated') {
    return value;
  }
  return null;
}

function parseTermsVersion(value: unknown): AuthTermsVersionPayload | null {
  if (!isObjectRecord(value)) {
    return null;
  }
  const id = value.id;
  const versionKey = value.versionKey;
  const title = value.title;
  const contentText = value.contentText;
  const enforcementStartsAt = value.enforcementStartsAt;
  const status = parseTermsVersionStatus(value.status);
  const announcementStartsAt = parseOptionalStringOrNull(value.announcementStartsAt);

  if (
    typeof id !== 'string' ||
    typeof versionKey !== 'string' ||
    typeof title !== 'string' ||
    typeof contentText !== 'string' ||
    typeof enforcementStartsAt !== 'string' ||
    status === null
  ) {
    return null;
  }

  return {
    id,
    versionKey,
    title,
    contentText,
    announcementStartsAt,
    enforcementStartsAt,
    status,
  };
}

export function parseAuthUser(value: unknown): AuthUserPayload | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const id = value.id;
  if (typeof id !== 'string') {
    return null;
  }

  const emailValue = value.email;
  const usernameValue = value.username;
  const hasEmail = typeof emailValue === 'string' && emailValue !== '';
  const hasUsername = typeof usernameValue === 'string' && usernameValue !== '';
  if (!hasEmail && !hasUsername) {
    return null;
  }

  const termsEnforcementStartsAt = value.termsEnforcementStartsAt;
  const hasAcceptedLatestTerms = value.hasAcceptedLatestTerms;
  const currentTermsVersionKey = value.currentTermsVersionKey;
  const termsPolicyPhase = parseTermsPolicyPhase(value.termsPolicyPhase);
  const acceptedCurrentTerms = value.acceptedCurrentTerms;
  const acceptedUpcomingTerms = value.acceptedUpcomingTerms;
  const needsUpcomingTermsAcceptance = value.needsUpcomingTermsAcceptance;
  const mustAcceptTermsNow = value.mustAcceptTermsNow;
  const currentTerms = parseTermsVersion(value.currentTerms);
  const upcomingTerms =
    value.upcomingTerms === null ? null : parseTermsVersion(value.upcomingTerms);
  const acceptedTerms =
    value.acceptedTerms === null ? null : parseTermsVersion(value.acceptedTerms);
  const upcomingTermsAcceptanceBy = parseOptionalStringOrNull(value.upcomingTermsAcceptanceBy);

  if (
    typeof termsEnforcementStartsAt !== 'string' ||
    typeof hasAcceptedLatestTerms !== 'boolean' ||
    typeof currentTermsVersionKey !== 'string' ||
    termsPolicyPhase === null ||
    typeof acceptedCurrentTerms !== 'boolean' ||
    typeof acceptedUpcomingTerms !== 'boolean' ||
    typeof needsUpcomingTermsAcceptance !== 'boolean' ||
    currentTerms === null ||
    (value.upcomingTerms !== null && upcomingTerms === null) ||
    (value.acceptedTerms !== null && acceptedTerms === null) ||
    typeof mustAcceptTermsNow !== 'boolean'
  ) {
    return null;
  }

  return {
    id,
    idText: typeof value.idText === 'string' ? value.idText : id,
    email: hasEmail ? emailValue : null,
    username: hasUsername ? usernameValue : null,
    displayName: parseOptionalStringOrNull(value.displayName),
    preferredCurrency: parseOptionalStringOrNull(value.preferredCurrency),
    termsAcceptedAt: parseOptionalStringOrNull(value.termsAcceptedAt),
    acceptedTermsEnforcementStartsAt: parseOptionalStringOrNull(
      value.acceptedTermsEnforcementStartsAt
    ),
    termsEnforcementStartsAt,
    hasAcceptedLatestTerms,
    currentTermsVersionKey,
    termsPolicyPhase,
    acceptedCurrentTerms,
    acceptedUpcomingTerms,
    needsUpcomingTermsAcceptance,
    upcomingTermsAcceptanceBy,
    mustAcceptTermsNow,
    termsBlockerMessage: parseOptionalStringOrNull(value.termsBlockerMessage),
    currentTerms,
    upcomingTerms,
    acceptedTerms,
  };
}

export function parseAuthEnvelope(value: unknown): AuthUserPayload | null {
  if (!isObjectRecord(value) || !isObjectRecord(value.user)) {
    return null;
  }
  return parseAuthUser(value.user);
}

export function parseAuthUserHeaderJson(value: string | null): AuthUserPayload | null {
  if (value === null || value === '') {
    return null;
  }
  try {
    return parseAuthUser(JSON.parse(value));
  } catch {
    return null;
  }
}
