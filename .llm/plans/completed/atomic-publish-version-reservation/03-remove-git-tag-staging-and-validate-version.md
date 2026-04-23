# 03 — Remove `git-tag-staging` and the `validate` version-calc step

## Scope

After Phase 1 has been shipped and verified, clean up the legacy bits in
[.github/workflows/publish-alpha.yml](../../../../.github/workflows/publish-alpha.yml):

1. Delete the `git-tag-staging` job (its work is now done by `reserve-version`).
2. Delete the `Calculate unified version` step from `validate` and remove
   `version` / `float_tag` / `is_prod` from `validate.outputs`.
3. Remove `git-tag-staging` and `validate` from any remaining `needs:` lists where
   they no longer contribute outputs.

## Edits

### Delete `git-tag-staging` (entire job)

Remove the job currently defined at lines ~353–412 of `publish-alpha.yml`
(`git-tag-staging:` through the end of its `script:` block).

### Update `github-prerelease-create.needs`

```yaml
  github-prerelease-create:
    needs: [reserve-version, verify-published-tags]
```

### Update `changelog-pr-to-develop.needs`

```yaml
  changelog-pr-to-develop:
    needs: [github-prerelease-create, reserve-version, verify-published-tags]
```

### Trim `validate`

Remove the `outputs:` block entirely:

```yaml
  validate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read
    # outputs: removed; reserve-version now provides version/float_tag/is_prod
    steps:
      - uses: actions/checkout@v6
      - name: Setup Node.js
        ...
      - name: Build apps
        run: npm run build:apps
      # `Calculate unified version` step is removed in this commit.
```

Delete the entire `Calculate unified version` step (currently lines ~64–231) and the
`outputs:` block at the top of the job.

## Optional safety net

If you want a read-only sanity check instead of fully removing the tag job, you can
keep a minimal verifier job that resolves `refs/tags/${{ needs.reserve-version.outputs.version }}`
and asserts it equals `${{ github.sha }}` (no createRef/move). This is **not**
recommended unless we hit a real-world issue — `reserve-version` already created the
tag and the API is the source of truth.

## Key files

- [.github/workflows/publish-alpha.yml](../../../../.github/workflows/publish-alpha.yml)

## Verification (this step)

- After this commit ships, push to `alpha`. Expect:
  - `validate` no longer runs the long version-calculation step (faster job).
  - `git-tag-staging` no longer appears in the run graph.
  - `reserve-version` is the only place a Git tag is created.
  - All downstream jobs succeed with the same `version` they had pre-cleanup.
