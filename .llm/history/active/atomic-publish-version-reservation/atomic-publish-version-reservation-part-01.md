### Session 1 - 2026-04-23

#### Prompt (Developer)

apply this plan revision to the .llm plan files, then execute Prompt 1.

#### Key Decisions

- Revised the phase plan docs first (00/01/04/05) to resolve 422 safety semantics, API wording consistency, and verification observability before implementing workflow changes.
- Kept Prompt 1 scope strict: added `reserve-version` job only, without removing `Calculate unified version` or deleting `git-tag-staging`.
- Added reserve-version outputs `version`, `float_tag`, and `is_prod` while leaving all downstream jobs untouched for later prompts.

#### Files Modified

- .llm/plans/active/atomic-publish-version-reservation/00-SUMMARY.md
- .llm/plans/active/atomic-publish-version-reservation/01-reserve-version-job.md
- .llm/plans/active/atomic-publish-version-reservation/04-docs-publish-update.md
- .llm/plans/active/atomic-publish-version-reservation/05-verification.md
- .github/workflows/publish-alpha.yml
- .llm/history/active/atomic-publish-version-reservation/atomic-publish-version-reservation-part-01.md
