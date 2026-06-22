### Session 2 - 2026-05-07

#### Prompt (Developer)

@podverse/.llm/plans/active/css-var-no-fallbacks/COPY-PASTA.md:23-24

#### Key Decisions

- Added `.cursor/rules/css-custom-properties-no-var-fallbacks.mdc`; cross-links in **global** and **reusable-components** skills; one-line in `.cursorrules`.

#### Files Modified

- `.cursor/rules/css-custom-properties-no-var-fallbacks.mdc`
- `.cursor/skills/global/SKILL.md`
- `.cursor/skills/reusable-components/SKILL.md`
- `.cursorrules`

### Session 1 - 2026-05-07

#### Prompt (Developer)

@podverse/.llm/plans/active/css-var-no-fallbacks/COPY-PASTA.md:16-17

#### Key Decisions

- Replaced `var(--color-border, #eee)` with `var(--color-border)` in bucket roles/messages module SCSS.
- Storybook decorator border uses `var(--color-border)` only (optional follow-up from plan).

#### Files Modified

- `apps/web/src/app/(main)/bucket/[id]/BucketRolesClient.module.scss`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/BucketRolesClient.module.scss`
- `apps/management-web/src/components/buckets/BucketMessagesClient.module.scss`
- `packages/ui/src/components/navigation/Dropdown/CaretMenuDropdown.stories.tsx`
