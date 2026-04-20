export type TermsPolicyPhase = 'pre_announcement' | 'announcement' | 'grace' | 'enforced';

export type AuthUserPayload = {
  id: string;
  shortId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  preferredCurrency: string | null;
  termsAcceptedAt: string | null;
  acceptedTermsEffectiveAt: string | null;
  latestTermsEffectiveAt: string;
  termsEnforcementStartsAt: string;
  hasAcceptedLatestTerms: boolean;
  currentTermsVersionKey: string;
  termsPolicyPhase: TermsPolicyPhase;
  acceptedCurrentTerms: boolean;
  mustAcceptTermsNow: boolean;
  termsBlockerMessage: string | null;
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
  if (
    value === 'pre_announcement' ||
    value === 'announcement' ||
    value === 'grace' ||
    value === 'enforced'
  ) {
    return value;
  }
  return null;
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

  const latestTermsEffectiveAt = value.latestTermsEffectiveAt;
  const termsEnforcementStartsAt = value.termsEnforcementStartsAt;
  const hasAcceptedLatestTerms = value.hasAcceptedLatestTerms;
  const currentTermsVersionKey = value.currentTermsVersionKey;
  const termsPolicyPhase = parseTermsPolicyPhase(value.termsPolicyPhase);
  const acceptedCurrentTerms = value.acceptedCurrentTerms;
  const mustAcceptTermsNow = value.mustAcceptTermsNow;

  if (
    typeof latestTermsEffectiveAt !== 'string' ||
    typeof termsEnforcementStartsAt !== 'string' ||
    typeof hasAcceptedLatestTerms !== 'boolean' ||
    typeof currentTermsVersionKey !== 'string' ||
    termsPolicyPhase === null ||
    typeof acceptedCurrentTerms !== 'boolean' ||
    typeof mustAcceptTermsNow !== 'boolean'
  ) {
    return null;
  }

  return {
    id,
    shortId: typeof value.shortId === 'string' ? value.shortId : id,
    email: hasEmail ? emailValue : null,
    username: hasUsername ? usernameValue : null,
    displayName: parseOptionalStringOrNull(value.displayName),
    preferredCurrency: parseOptionalStringOrNull(value.preferredCurrency),
    termsAcceptedAt: parseOptionalStringOrNull(value.termsAcceptedAt),
    acceptedTermsEffectiveAt: parseOptionalStringOrNull(value.acceptedTermsEffectiveAt),
    latestTermsEffectiveAt,
    termsEnforcementStartsAt,
    hasAcceptedLatestTerms,
    currentTermsVersionKey,
    termsPolicyPhase,
    acceptedCurrentTerms,
    mustAcceptTermsNow,
    termsBlockerMessage: parseOptionalStringOrNull(value.termsBlockerMessage),
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
