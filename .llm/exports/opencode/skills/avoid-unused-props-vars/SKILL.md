---
name: avoid-unused-props-vars
description: Do not keep unused props or variables. Remove them from types and call sites (or delete the variable) instead of using _unused or "intentionally unused" patterns. Use when adding or refactoring component props, function parameters, or local variables.
---


# Avoid Unused Props and Variables

Do not add or keep props or variables that are never used. Prefer removing them over using underscore or "intentionally unused" patterns.

## Do

- Remove the prop from the component's props type and from every caller.
- Remove unused local variables or parameters when you control the interface.
- Rely on derived values (e.g. `canEditPermissions`) at the caller instead of passing raw data the component does not use.

## Don't

- Add or keep props "for callers" that the component never uses.
- Destructure as `prop: _prop` or `prop: _unused` just to satisfy the linter when the prop can be removed.
- Keep variables that are never read.

## Exception

When a symbol is required by an external interface or API and cannot be removed (e.g. a callback signature that must accept a parameter), the underscore pattern is acceptable. Add a brief comment explaining why it is required.
