# 02 — Rewire `needs:` and `outputs:` to `reserve-version`

## Scope

Repoint every downstream job in
[.github/workflows/publish-alpha.yml](../../../../.github/workflows/publish-alpha.yml)
that currently reads `needs.validate.outputs.{version,float_tag,is_prod}` so that it
reads `needs.reserve-version.outputs.*` instead, and add `reserve-version` to each
job's `needs:` list.

The `validate` job's `outputs:` block stays for now (cleaned up in `03-...`) so this
is a pure rewire — same values, new source.

## Changes

### `publish-docker`

```yaml
  publish-docker:
    needs: [validate, reserve-version]   # was: needs: validate
    ...
    steps:
      ...
      - name: Build and push Docker image
        uses: docker/build-push-action@v7
        with:
          ...
          tags: |
            ghcr.io/${{ github.repository }}/${{ matrix.app }}:${{ needs.reserve-version.outputs.version }}
            ghcr.io/${{ github.repository }}/${{ matrix.app }}:${{ needs.reserve-version.outputs.float_tag }}
```

### `verify-published-tags`

```yaml
  verify-published-tags:
    needs: [reserve-version, publish-docker]   # was: [validate, publish-docker]
    ...
        env:
          VERSION: ${{ needs.reserve-version.outputs.version }}
          FLOAT_TAG: ${{ needs.reserve-version.outputs.float_tag }}
```

### `workflow-summary`

```yaml
  workflow-summary:
    needs: [reserve-version, verify-published-tags]   # was: [validate, verify-published-tags]
    ...
        env:
          VERSION: ${{ needs.reserve-version.outputs.version }}
          REPO: ${{ github.repository }}
          FT: ${{ needs.reserve-version.outputs.float_tag }}
```

(Update the inline `${{ needs.validate.* }}` references inside the `run:` heredoc to
`${{ needs.reserve-version.* }}` as well.)

### `github-prerelease-create`

```yaml
  github-prerelease-create:
    needs: [reserve-version, git-tag-staging]   # git-tag-staging removed in 03
    ...
        env:
          IS_PROD: ${{ needs.reserve-version.outputs.is_prod }}
        with:
          script: |
            const version = "${{ needs.reserve-version.outputs.version }}";
            ...
```

### `changelog-pr-to-develop`

```yaml
  changelog-pr-to-develop:
    needs: [github-prerelease-create, reserve-version, git-tag-staging]
    ...
        env:
          PUBLISH_VERSION: ${{ needs.reserve-version.outputs.version }}
          ...
      - name: Open pull request
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "chore: archive changelog for ${{ github.ref_name }} ${{ needs.reserve-version.outputs.version }}"
          title: "chore: archive changelog for ${{ needs.reserve-version.outputs.version }} (${{ github.ref_name }})"
          ...
          branch: automation/changelog-${{ github.ref_name }}-${{ needs.reserve-version.outputs.version }}-${{ github.run_id }}
```

(Existing `persist-credentials: false` on `Check out develop` and explicit `token:`
on `peter-evans/create-pull-request@v6` are already in place — keep them.)

## Note on `git-tag-staging`

This step keeps `git-tag-staging` in the graph (it's removed in `03-...`) but the new
`reserve-version` job has already created the tag at `github.sha`, so
`git-tag-staging` will hit its "tag already points at targetSha → noop" branch. That
makes Phase 1 safe to ship without Phase 2.

## Key files

- [.github/workflows/publish-alpha.yml](../../../../.github/workflows/publish-alpha.yml)

## Verification (this step)

- After Phase 1 ships, push to `alpha`. Expect:
  - `reserve-version` log: `Reserved version: 0.1.X-staging.N`.
  - `git-tag-staging` log: `Tag 0.1.X-staging.N already points at <sha>; noop.`
  - `publish-docker`, `verify-published-tags`, `workflow-summary`, release/PR jobs
    all see the same version string.
