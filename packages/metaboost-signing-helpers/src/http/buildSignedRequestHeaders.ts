/**
 * Builds the `Authorization` header for a signed Standard Endpoint POST.
 */
export function buildSignedRequestHeaders(options: { jwt: string }): {
  Authorization: string;
} {
  const token = options.jwt.trim();
  if (token.length === 0) {
    throw new Error(
      'metaboost-signing-helpers: jwt must be a non-empty AppAssertion token string.'
    );
  }

  return {
    Authorization: `AppAssertion ${token}`,
  };
}
