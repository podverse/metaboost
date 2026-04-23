# 04 — Update `docs/PUBLISH.md`

## Scope

Reflect the new atomic version reservation in
[docs/PUBLISH.md](../../../../docs/PUBLISH.md). Specifically:

1. Replace any wording that says version `N` is auto-incremented from **GHCR tags**
   with wording that says it's reserved via the **GitHub Git Refs API** (atomic create).
2. Clarify that GHCR is **image storage only** — not the source of truth for the
   next `N`.
3. Mention that the `git ls-remote --tags` step is a hint to skip empty `N` values,
   not a correctness mechanism.

## Concrete edits

### Top table footnote

Change the `alpha` row's `(N from GHCR for that base)` to
`(N reserved atomically via Git tag API)`:

```diff
-| `alpha`    | `X.Y.Z-staging.N` (N from GHCR for that base) | `staging`         |
+| `alpha`    | `X.Y.Z-staging.N` (N reserved atomically via Git tag) | `staging`         |
```

### "What gets published" / version-derivation paragraph

Replace the paragraph that says:

> Each image is tagged with `:staging` ... an immutable version tag
> `X.Y.Z-staging.N` derived from root `package.json` base version (prerelease
> stripped) plus an auto-incremented **N** from existing GHCR tags for that base.
> The workflow also checks existing Git tags for the same prerelease line before
> finalizing `N` so it will not reuse a taken …

with:

> Each image is tagged with `:staging` and an immutable version tag
> `X.Y.Z-staging.N`. The base `X.Y.Z` comes from root `package.json` (prerelease
> stripped). `N` is selected by the workflow's `reserve-version` job, which
> atomically creates `refs/tags/X.Y.Z-staging.N` at the workflow commit via the
> GitHub Git Refs API and increments `N` on `422 Reference already exists`.
> Existing Git tags are inspected only as a starting hint to skip empty `N`
> values; correctness comes from the atomic create itself.
>
> GHCR is the storage and verification layer for image tags; it is no longer used
> to pick the next `N`.

### `version_override` mention

Update step 3 in "How to publish":

```diff
-You can set **version override** (e.g. `0.1.2-staging.99` for alpha) to skip GHCR auto-increment.
+You can set **version override** (e.g. `0.1.2-staging.99` for alpha) to skip the
+atomic auto-increment and reserve a specific tag.
```

Also clarify exact-tag collision behavior: for `version_override` (and `main`
RTM tags), `422 Reference already exists` is accepted only when the existing tag
already points to the workflow commit SHA; otherwise the workflow fails.

### Add a short "Atomic version reservation" subsection

Insert near the bottom of the file (before promotion scripts) a small subsection
that explains the new model in 5-10 lines, with a link back to the workflow file
and to this plan set for context.

## Key files

- [docs/PUBLISH.md](../../../../docs/PUBLISH.md)
- [.github/workflows/publish-alpha.yml](../../../../.github/workflows/publish-alpha.yml) (cross-reference only)

## Verification (this step)

- Re-read `docs/PUBLISH.md` end-to-end. Confirm the only references to GHCR for
  selecting `N` are gone.
- Markdown lint: ensure tables and links are intact.
