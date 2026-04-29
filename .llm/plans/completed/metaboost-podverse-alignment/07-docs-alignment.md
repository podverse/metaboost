## Plan: Documentation Alignment

Rewrite docs to reflect only the new aligned system and remove all obsolete process references.

## Steps
1. Update AGENTS and quick-start guides to new env, CI, migration, and k8s contracts.
2. Update env docs to remove template contract-centric guidance.
3. Remove any remaining template contract references from maintained source/docs paths unless they are explicit historical/archive context.
4. Update k8s runbooks to align with in-repo alpha app-of-apps and remote GitOps usage model.
5. Update migration docs for linear baseline generation and verification workflow.
6. Update publish and contributing docs for final CI and release behavior.
7. Align related Cursor guidance files with Podverse where they are part of documentation and process contracts covered by this phase.
8. Run docs consistency pass for command accuracy and file path validity.

## Relevant files
- AGENTS.md
- docs/QUICK-START.md
- docs/development/env/LOCAL-ENV-OVERRIDES.md
- docs/development/env/ENV-REFERENCE.md
- docs/development/env/ENV-VARS-CATALOG.md
- docs/development/CONTRIBUTING.md
- docs/PUBLISH.md
- docs/development/k8s/REMOTE-K8S-GITOPS.md
- docs/development/k8s/ARGOCD-GITOPS-METABOOST.md

## Verification
1. All docs reference current commands and file paths.
2. No stale references remain for removed workflows.
3. Repository grep over maintained source/docs paths confirms no active template contract-system references remain.
4. Terminology is consistent across env, CI, migration, and k8s docs.
5. `./scripts/nix/with-env npm run lint` passes for docs-linked config/script changes.
6. Podverse reference-alignment checklist for edited docs is complete.

## Decisions
- No legacy path descriptions.
- No transitional recommendation text.
- Docs describe only the clean forward path.
- Template contract system is fully removed from maintained source/docs references by end of this phase.
- Cursor alignment is in-scope only for docs/process-related `.cursor` files touched by this phase.
