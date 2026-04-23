# COPY-PASTA — Atomic Publish Version Reservation (metaboost)

Copy each prompt block below into a fresh chat (or paste into the current one) to
have me execute the corresponding plan file. Run them **sequentially** in this
order. Do **not** start the podverse plan set until prompt 5 is verified green on
a real `alpha` run.

---

## Prompt 1 — Add `reserve-version` job

Status: Completed (2026-04-23)

```
Implement plan file
.llm/plans/completed/atomic-publish-version-reservation/01-reserve-version-job.md
in the metaboost repo. Add the `reserve-version` job to
.github/workflows/publish-alpha.yml between `validate` and `publish-docker` exactly
as specified. Do NOT delete the existing `Calculate unified version` step or the
`git-tag-staging` job in this commit; that happens in plan 03. Confirm the new job
exposes `version`, `float_tag`, `is_prod` outputs.
```

---

## Prompt 2 — Rewire downstream jobs to consume `reserve-version`

Status: Completed (2026-04-23)

```
Implement plan file
.llm/plans/completed/atomic-publish-version-reservation/02-rewire-needs-and-outputs.md
in the metaboost repo. In .github/workflows/publish-alpha.yml, repoint
`publish-docker`, `verify-published-tags`, `workflow-summary`,
`github-prerelease-create`, and `changelog-pr-to-develop` so all
`needs.validate.outputs.{version,float_tag,is_prod}` references become
`needs.reserve-version.outputs.*`, and add `reserve-version` to each `needs:` list.
Leave the `validate` outputs and `git-tag-staging` job in place for now (cleaned
up in plan 03).
```

---

## Prompt 3 — Remove `git-tag-staging` and the `validate` version-calc step

Status: Completed (2026-04-23)

```
Implement plan file
.llm/plans/completed/atomic-publish-version-reservation/03-remove-git-tag-staging-and-validate-version.md
in the metaboost repo. In .github/workflows/publish-alpha.yml: delete the entire
`git-tag-staging` job; delete the `Calculate unified version` step from `validate`;
remove the `outputs:` block from `validate`; and update any `needs:` lists that
still reference `git-tag-staging`.
```

---

## Prompt 4 — Update `docs/PUBLISH.md`

Status: Completed (2026-04-23)

```
Implement plan file
.llm/plans/completed/atomic-publish-version-reservation/04-docs-publish-update.md
in the metaboost repo. Update docs/PUBLISH.md so it describes atomic version
reservation via the GitHub Git Refs API and clarifies that GHCR is image storage
only. Apply the concrete edits in the plan file.
```

---

## Prompt 5 — Verify the new pipeline on `alpha`

Status: Completed (2026-04-23)
Run URL: https://github.com/podverse/metaboost/actions/runs/24857171910

```
Walk through plan file
.llm/plans/completed/atomic-publish-version-reservation/05-verification.md
on the metaboost repo. After triggering an `alpha` publish, post the workflow run
URL and confirm checklist items 1–8 are green. Do NOT start the podverse plan set
until this is verified.
```
