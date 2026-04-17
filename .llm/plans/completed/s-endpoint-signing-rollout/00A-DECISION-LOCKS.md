# 00A - Decision Locks

## Purpose

Lock critical decisions before implementation so the rollout can proceed without rework or security regressions.

## Decision Locks

### 1) Signing Helper Package Security Model

- Signing helpers are backend-only utilities consumed inside third-party APIs.
- Baseline policy:
  - private keys never leave backend infrastructure and are never embedded in client apps;
  - helpers must not expose convenience patterns that encourage client-side signing;
  - docs must include minimum secure key storage guidance for consumers.

### 2) Canonicalization And Hash Contract

- Sign and verify against the same canonical tuple:
  - `m`: uppercased HTTP method;
  - `p`: exact path plus query string sent to Metaboost;
  - `bh`: base64url hash of raw request body bytes.
- No body reserialization is allowed in signing or verification logic.
- Canonicalization examples:
  - `m` example: `post` -> `POST`
  - `p` example: `/v1/s/mbrss-v1/boost/abc123?source=web` (no scheme/host/fragment)
  - `bh` example source bytes: exact outbound request body bytes as sent on the wire.

### 3) Verifier Raw-Body Strategy

- Metaboost API must capture request raw bytes at middleware parse boundary.
- Verification computes `bh` only from captured raw bytes.

### 4) Registry Shape And Default URL Contract

- Registry uses basic app metadata plus public signing keys:
  - `app_id`, `display_name`, `owner`, `status`, `created_at`, `updated_at`, `signing_keys[]`.
- Metaboost default registry source is:
  - `https://raw.githubusercontent.com/podverse/metaboost-registry/main/registry/apps`
  - with per-app lookups at `<base>/<app_id>.app.json`.
- Registry source is overridable with env configuration.
- Registry PRs must pass GitHub Actions `validate-registry` as a required merge check.

### 5) Key Rotation Semantics

- Support multiple active keys in `signing_keys[]` for overlap during rotation.
- `kid` policy:
  - if `kid` is present in assertion, it must match;
  - if `kid` is absent, verifier tries active keys for the app.

### 6) Unsigned-Client Migration Mode

- Hard-enforce from first release.
- No legacy compatibility mode, migration stage, or fallback behavior in v1.

### 7) HTTPS Enforcement With Proxies

- Fix trusted-proxy policy for non-local environments.
- Define request rejection behavior for insecure transport outside local development.

### 8) Phase Completion Checks

- Keep approvals simple:
  - each phase is marked complete in the plan set when acceptance criteria are met;
  - no additional role hierarchy is required in registry design or implementation scope.

## Exit Criteria

- All eight decisions are explicitly approved.
- Environment variable names and defaults are frozen.
- First-version enforcement policy is hard-enforce only.

## Completion Status

- Completed on 2026-04-16.
- Decision locks approved and propagated to dependent plan files.
