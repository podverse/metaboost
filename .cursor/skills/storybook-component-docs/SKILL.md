---
name: storybook-component-docs
description: Add or update Storybook stories when adding or changing UI components in packages/ui. Use when creating or modifying components in @metaboost/ui.
version: 1.0.0
---

# Storybook component docs

**When to use:** When you add a new component to `packages/ui`, or when you change a component’s props, variants, or visible behavior in a way that should be documented or visually verified.

## Principles

1. **Co-locate stories with components.** Add a `ComponentName.stories.tsx` file next to (or in the same directory as) the component.
2. **Use CSF (Component Story Format).** Default export is `meta` (`Meta<typeof Component>`); named exports are stories (`StoryObj<typeof Component>`).
3. **Cover main variants and states.** Include at least one default story; add stories for variants (e.g. primary/secondary), loading, disabled, and error states where relevant.
4. **Expose props as controls.** Use `argTypes` in meta so docs and controls reflect the component’s API.

## How to run Storybook

From repo root (use Nix wrapper in agent/automated environments):

```bash
./scripts/nix/with-env npm run storybook -w @metaboost/ui
```

Or from `packages/ui`: `npm run storybook`. Dev server runs at http://localhost:6006.

## Reference

- **Package doc:** [packages/ui/PACKAGES-UI.md](../../../packages/ui/PACKAGES-UI.md) – how to run Storybook, where stories live, how to add a new story.
