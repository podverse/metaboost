# 04 — Adopt Podverse UI and shared standards

## Scope

Shared UI/docs/import standards. Some **rules** (`shared-ui-i18n`, `prefer-shared-ui-web-management`)
are adopted in `metaboost-abcmemory-align/01` — this plan adds **skills** and remaining rules.

## ADOPT — skills

| Skill | Notes |
| --- | --- |
| `modal-layout-contract` | `@metaboost/ui` Modal API |
| `styles-source-of-truth` | SCSS tokens in `packages/ui` |
| `styles-import-last` | Component import order |
| `ui-component-promotion` | Cross-app promotion; cross-link `reusable-components` |
| `ui-e2e-screenshot-report` | Narrow make report targets; cross-link `response-ending-make-verify` |
| `time-format-local` | Display time formatting |
| `rate-limit-message` | API rate-limit UX copy |
| `routing-url-params` | Next.js URL state |

## ADOPT — rules

| Rule | Notes |
| --- | --- |
| `app-internal-import-aliases` | App `src/` alias conventions |

## N/A (Podverse product UI)

`form-primary-actions-row`, `header-hero-image-sources`, `navbar-sticky-chrome`,
`font-preloads-route-aware`, `custom-themes-operator-sample-sync`, `management-web-*` rules,
`integrations-web`, `media-player-architecture`, `add-by-rss-*`, `lighthouse-*`, `bundle-optimization`.

## Overlap — do not duplicate

| Existing MB | Notes |
| --- | --- |
| `reusable-components` skill | Keep; cross-link `ui-component-promotion` |
| `end-with-targeted-make-report-verify` rule | Keep MB `E2E_API_GATE_MODE` policy |
| `i18n` skill + `i18n-locale-language` rule | Keep vs Podverse `i18n-management` |

## Steps

1. Port skills; adapt `@metaboost/ui`, app paths.
2. Add `app-internal-import-aliases.mdc` from Podverse.

## Verification

```bash
test -f .cursor/skills/modal-layout-contract/SKILL.md && echo ok
```
