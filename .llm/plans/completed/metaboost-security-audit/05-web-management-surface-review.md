# 05 - Web and Management-Web Attack Surface Review

## Scope

Review Next.js web surfaces for redirect safety, trust boundaries, and auth/session misuse risk.

## Steps

1. Trace request handling in server-side proxy/middleware paths.
2. Validate trust model for server-only headers (for example auth context headers).
3. Review `returnUrl` and redirect logic for open redirect bypass variants.
4. Check cookie forwarding and session restore flows for over-broad propagation.
5. Audit invite/reset/account pages for token handling and sensitive-state transitions.

## Key Files

- `apps/web/src/proxy.ts`
- `apps/web/src/lib/server-auth.ts`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/management-web/src/proxy.ts`
- Any auth/invite/reset pages reached from those entry points

## Output

- `Web surface findings report` with:
  - confirmed-safe patterns
  - redirect or trust-boundary weaknesses
  - concrete hardening actions and suggested tests

## Verification

- Every redirect source/sink pair is mapped.
- Header trust assumptions are explicitly confirmed or flagged.
- Sensitive flows include both unauthenticated and authenticated threat perspectives.
