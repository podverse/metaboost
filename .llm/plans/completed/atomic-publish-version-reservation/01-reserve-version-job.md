# 01 — Add `reserve-version` job

## Scope

Add a new job to [.github/workflows/publish-alpha.yml](../../../../.github/workflows/publish-alpha.yml)
that atomically reserves the next publish version by creating
`refs/tags/X.Y.Z-{suffix}.N` at the workflow commit. The job runs **after**
`validate` and **before** `publish-docker`.

In this step we **add** the new job and leave the old `validate` version-calc step
and `git-tag-staging` job in place. They are removed in `03-...`.

## Behavior

- Inputs:
  - `github.ref_name` (`alpha` | `beta` | `main`)
  - Optional `inputs.version_override`
- Suffix / float-tag mapping:
  - `main`  → no suffix; `FLOAT_TAG=prod`;    `is_prod=true`
  - `alpha` → `staging`;  `FLOAT_TAG=staging`; `is_prod=false`
  - `beta`  → `beta`;     `FLOAT_TAG=beta`;    `is_prod=false`
- Loop, starting at a smart `N`:
  1. Call the GitHub Git Refs API create-ref endpoint
     (`POST /repos/${{ github.repository }}/git/refs`)
     with `ref=refs/tags/X.Y.Z-{suffix}.N`, `sha=${{ github.sha }}`.
  2. HTTP 201 → set `VERSION` and break.
  3. HTTP 422 (`Reference already exists`) → `N++` and retry.
  4. Anything else → fail loudly with the GitHub API response body.
- Smart start hint:
  - `git ls-remote --tags origin "refs/tags/${BASE}-${SUFFIX}.*"`, take `max(N)+1`
    as the starting `N`. Use `set -euo pipefail`. If the listing fails or returns
    nothing, log the fallback and start at `N=0`; the atomic create still guarantees
    correctness.
- `version_override`:
  - Use it verbatim. Still attempt create-ref.
  - HTTP 201 → success.
  - HTTP 422 → resolve the existing tag target commit and only succeed if it
    equals `github.sha`; otherwise fail loudly before publish.
- `main` (exact `X.Y.Z`) follows the same exact-tag rule as `version_override`:
  201 succeeds; 422 requires same-commit verification.
- Logging requirements:
  - Log each create-ref attempt with tag + HTTP status.
  - On 422 for exact-tag reservations, log whether it was accepted because it
    already points to `github.sha` or rejected due to SHA mismatch.

## Outputs

Same names the rest of the workflow consumes today:

- `version`
- `float_tag`
- `is_prod`

## Job skeleton

```yaml
  reserve-version:
    needs: validate
    runs-on: ubuntu-latest
    permissions:
      contents: write
    outputs:
      version: ${{ steps.reserve.outputs.version }}
      float_tag: ${{ steps.reserve.outputs.float_tag }}
      is_prod: ${{ steps.reserve.outputs.is_prod }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Reserve next version
        id: reserve
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REF_NAME: ${{ github.ref_name }}
          SHA: ${{ github.sha }}
          OVERRIDE: ${{ inputs.version_override }}
        run: |
          set -euo pipefail
          BASE=$(node -p "require('./package.json').version" | sed 's/-.*//')
          REPO="${{ github.repository }}"
          case "$REF_NAME" in
            main)  SUFFIX=""        ; FLOAT=prod    ; IS_PROD=true  ;;
            alpha) SUFFIX="staging" ; FLOAT=staging ; IS_PROD=false ;;
            beta)  SUFFIX="beta"    ; FLOAT=beta    ; IS_PROD=false ;;
            *) echo "Unsupported ref $REF_NAME"; exit 1 ;;
          esac

          create_tag() {
            # $1 tag, $2 sha; sets LAST_CREATE_CODE and LAST_CREATE_BODY
            local tag="$1"
            local sha="$2"
            local code body
            body=$(mktemp)
            code=$(curl -sS -o "$body" -w "%{http_code}" \
              -H "Authorization: Bearer $GH_TOKEN" \
              -H "Accept: application/vnd.github+json" \
              -X POST "https://api.github.com/repos/${REPO}/git/refs" \
              -d "{\"ref\":\"refs/tags/${tag}\",\"sha\":\"${sha}\"}")
            LAST_CREATE_CODE="$code"
            LAST_CREATE_BODY=$(cat "$body")
            echo "create-ref attempt: tag=${tag} status=${code}"
            if [ "$code" != "201" ] && [ "$code" != "422" ]; then
              echo "GitHub API error $code while creating tag ${tag}:" >&2
              printf '%s\n' "$LAST_CREATE_BODY" >&2
            fi
            rm -f "$body"
          }

          resolve_tag_commit_sha() {
            # $1 tag; echoes commit SHA the tag resolves to
            local tag="$1"
            local ref_body ref_code obj_type obj_sha tag_body tag_code commit_sha
            ref_body=$(mktemp)
            ref_code=$(curl -sS -o "$ref_body" -w "%{http_code}" \
              -H "Authorization: Bearer $GH_TOKEN" \
              -H "Accept: application/vnd.github+json" \
              "https://api.github.com/repos/${REPO}/git/ref/tags/${tag}")
            if [ "$ref_code" != "200" ]; then
              echo "Failed to resolve existing tag ${tag} (HTTP ${ref_code})" >&2
              cat "$ref_body" >&2
              rm -f "$ref_body"
              return 1
            fi
            obj_type=$(jq -r '.object.type // ""' "$ref_body")
            obj_sha=$(jq -r '.object.sha // ""' "$ref_body")
            rm -f "$ref_body"

            if [ "$obj_type" = "commit" ]; then
              printf '%s\n' "$obj_sha"
              return 0
            fi
            if [ "$obj_type" = "tag" ]; then
              tag_body=$(mktemp)
              tag_code=$(curl -sS -o "$tag_body" -w "%{http_code}" \
                -H "Authorization: Bearer $GH_TOKEN" \
                -H "Accept: application/vnd.github+json" \
                "https://api.github.com/repos/${REPO}/git/tags/${obj_sha}")
              if [ "$tag_code" != "200" ]; then
                echo "Failed to resolve annotated tag object for ${tag} (HTTP ${tag_code})" >&2
                cat "$tag_body" >&2
                rm -f "$tag_body"
                return 1
              fi
              commit_sha=$(jq -r '.object.sha // ""' "$tag_body")
              rm -f "$tag_body"
              printf '%s\n' "$commit_sha"
              return 0
            fi

            echo "Unexpected Git ref object type '${obj_type}' for tag ${tag}" >&2
            return 1
          }

          require_same_sha_on_422() {
            # $1 tag
            local tag="$1"
            local existing_sha
            existing_sha=$(resolve_tag_commit_sha "$tag")
            if [ "$existing_sha" = "$SHA" ]; then
              echo "Tag ${tag} already points at ${SHA}; accepting 422."
              return 0
            fi
            echo "Refusing to reuse tag ${tag}: it points at ${existing_sha}, workflow commit is ${SHA}" >&2
            return 1
          }

          if [ -n "$OVERRIDE" ]; then
            VERSION="$OVERRIDE"
            create_tag "$VERSION" "$SHA"
            code="$LAST_CREATE_CODE"
            if [ "$code" = "201" ]; then
              echo "Reserved explicit override tag ${VERSION}."
            elif [ "$code" = "422" ]; then
              require_same_sha_on_422 "$VERSION" || exit 1
            else
              exit 1
            fi
          elif [ "$REF_NAME" = "main" ]; then
            VERSION="$BASE"
            create_tag "$VERSION" "$SHA"
            code="$LAST_CREATE_CODE"
            if [ "$code" = "201" ]; then
              echo "Reserved RTM tag ${VERSION}."
            elif [ "$code" = "422" ]; then
              require_same_sha_on_422 "$VERSION" || exit 1
            else
              exit 1
            fi
          else
            START=0
            if TAG_LINES=$(git ls-remote --tags origin "refs/tags/${BASE}-${SUFFIX}.*" 2>/dev/null); then
              MAX=$(printf '%s\n' "$TAG_LINES" | awk -v prefix="refs/tags/${BASE}-${SUFFIX}." '
                {
                  ref=$2
                  sub(/\^\{\}$/, "", ref)
                  if (index(ref, prefix) == 1) {
                    n=substr(ref, length(prefix) + 1)
                    if (n ~ /^[0-9]+$/) {
                      if (max == "" || (n + 0) > (max + 0)) {
                        max=n + 0
                      }
                    }
                  }
                }
                END {
                  if (max != "") {
                    print max
                  }
                }
              ')
              if [ -n "$MAX" ]; then
                START=$((MAX + 1))
              fi
              echo "Smart-start candidate N=${START}."
            else
              echo "git ls-remote failed for ${BASE}-${SUFFIX}; starting at N=0."
            fi
            N=$START
            while :; do
              VERSION="${BASE}-${SUFFIX}.${N}"
              create_tag "$VERSION" "$SHA"
              code="$LAST_CREATE_CODE"
              if [ "$code" = "201" ]; then break; fi
              if [ "$code" = "422" ]; then
                echo "Tag ${VERSION} exists; incrementing N."
                N=$((N + 1))
                continue
              fi
              exit 1
            done
          fi

          echo "Reserved version: $VERSION"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
          echo "float_tag=$FLOAT" >> "$GITHUB_OUTPUT"
          echo "is_prod=$IS_PROD" >> "$GITHUB_OUTPUT"
```

## Key files

- [.github/workflows/publish-alpha.yml](../../../../.github/workflows/publish-alpha.yml)

## Verification (this step)

- `act` not required; verification happens end-to-end in `05-verification.md`.
- Lint: workflow YAML parses (push/PR will trigger Actions parser).
- Manual eyeball: confirm the new job's `needs:`, `permissions:`, and `outputs:` match
  what the next plan rewires.
