---
name: e2e-url-state-contracts
description: Enforces URL-state contract tests for sortable/filterable pages in Playwright. Use when pages support search, sort, filters, pagination, or tab query params.
version: 1.0.0
---

# E2E URL State Contracts

Current E2E bar: **Confident**. Use this skill for pages with query-param state.

Apply this alongside **e2e-page-tests** for page-behavior coverage, and alongside **e2e-crud-state-matrix** when URL-state behavior affects CRUD list/detail flows.

## Contract checklist

- [ ] Supports expected params (`search`, `sortBy`, `sortOrder`, `page`, `tab`, etc.).
- [ ] Preserves explicit params on load.
- [ ] Applies canonicalization rules consistently (no unstable URL drift).
- [ ] Back/forward navigation keeps user-visible state aligned with URL.
- [ ] Defaults are not redundantly forced into URL unless product behavior requires it.

## Assertion guidance

- Parse `new URL(page.url())` and assert pathname + relevant params exactly.
- Assert visible table/list state that corresponds to URL state (not URL alone).
- For canonicalized routes, assert accepted canonical patterns explicitly.

## Avoid

- Overly permissive URL regexes that allow unintended params.
- Assertions that only check the page heading after navigation.

## Completion checklist

- [ ] At least one query-param contract test per modified sortable/filterable surface.
- [ ] Contract tests included in targeted and full E2E verification runs.
- [ ] Companion page-behavior assertions are covered in the relevant e2e-page-tests spec.
