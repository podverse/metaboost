## Plan: 01a Env Contract Source of Truth

Define and lock the canonical env contract before script cutover.

## Steps
1. Define authoritative env sources per app and infra workload (app `.env.example`, sidecar examples, infra templates where applicable).
2. Remove template contract as canonical source in plan-level contract language.
3. Build a reference-alignment matrix versus Podverse for source-of-truth file locations and expected precedence.
4. Align related Cursor files with Podverse only for env contract guidance (`.cursor/skills/**`, `.cursor/rules/**`, `.cursorrules`) where directly relevant.

## Relevant files
- apps/api/.env.example
- apps/management-api/.env.example
- apps/web/.env.example
- apps/web/sidecar/.env.example
- apps/management-web/.env.example
- apps/management-web/sidecar/.env.example
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md

## Verification
1. Every runtime env variable used by services is represented in canonical templates/examples.
2. Reference-alignment matrix against Podverse contract is recorded (match or intentional divergence).
3. No references describe template contract as canonical source.
