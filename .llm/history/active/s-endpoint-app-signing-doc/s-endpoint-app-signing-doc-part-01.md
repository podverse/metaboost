### Session 1 - 2026-04-16

#### Prompt (Developer)

`/s/` Endpoint App-Signing Proposal Document

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Use a public GitHub registry with manual PR approval as the trust source for app public keys.
- Use short-lived App Assertion JWTs (`EdDSA` preferred, `ES256` supported) signed by app
  backends for `/s` POST requests.
- Keep write endpoints callable from anywhere, but require backend-minted assertions so private
  keys are never exposed in browser/mobile clients.
- Define explicit verification failure taxonomy (`401/403/409/429`) and phased rollout from shadow
  mode to hard enforcement.
- Include three mermaid process diagrams for registration, request verification, and abuse response.

#### Files Modified

- docs/api/S-ENDPOINT-APP-SIGNING.md
- .llm/history/active/s-endpoint-app-signing-doc/s-endpoint-app-signing-doc-part-01.md

### Session 3 - 2026-04-16

#### Prompt (Developer)

update

#### Key Decisions

- Simplify registry structure to one file per app (`registry/apps/<app_id>.json`).
- Use one signing key per app id in v1 (embedded `signing_key` object), no `keys/` directory.
- Simplify JWT header requirements by removing `kid`.
- Update verification and error taxonomy to app-level status (`app_suspended`) instead of key-level
  statuses.
- Update process diagrams and abuse operations to app-level suspension + key rotation.

#### Files Modified

- docs/api/S-ENDPOINT-APP-SIGNING.md
- .llm/history/active/s-endpoint-app-signing-doc/s-endpoint-app-signing-doc-part-01.md

### Session 2 - 2026-04-16

#### Prompt (Developer)

lets make the S-ENDPOINT-APP-SIGNING even simpler. we don't need a phased approach as we want a complete final solution to be deployed on day 1

we don't care about scopes. if an app is in the registry, it has the same permissions as any other app in the registry.

fundamentally, we just want apps to 1) add their public key and basic metadata to a public registry repo, 2) sign every request to the /s/ endpoint with their key, 3) metaboost then verifies the signed request is valid before allowing the post message to be successful

We are fine with trading off in favor of simplicity instead of following a hardened web standard. We want this to be as easy as possible for apps. We simply want a way to be able to rate limit and stop access from apps to metaboost if the app becomes a source of abuse

#### Key Decisions

- Simplify to a single day-1 final deployment model with no phased rollout.
- Remove per-app scopes entirely; any app in the registry has the same `/s` write permissions.
- Keep the core flow to three steps: registry onboarding, per-request signing, server verification.
- Keep abuse controls focused on app-level attribution, rate limiting, and app/key suspension.
- Keep the document explicitly simplicity-first and avoid requiring hardened web standards.

#### Files Modified

- docs/api/S-ENDPOINT-APP-SIGNING.md
- .llm/history/active/s-endpoint-app-signing-doc/s-endpoint-app-signing-doc-part-01.md
