# 02 — Metaboost runtime and theme system

## Objective

Plan Metaboost implementation details for custom remote themes.

## Scope

- Sidecar env/runtime-config wiring and validation.
- Dynamic theme registry integration in UI/theme context/cookie parsing.
- SSR first-render CSS-variable application (no FOUC).
- Explicit `next.config` decision for remote loading strategy (document whether changes are required).
- Test-assets fixture path and local HTTP serving plan.
