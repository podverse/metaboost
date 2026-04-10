# @metaboost/ui

Shared UI components, styles, and hooks for the Metaboost apps (web, management-web).

## Styles: design tokens and mixins

**Single source of truth:** `src/styles/`

- **Design tokens** (`_variables.scss`): Colors, spacing, typography, breakpoints, focus/opacity, z-index, shadows. Use in app or component SCSS via `@use '@metaboost/ui/styles/variables' as *;`
- **Mixins** (`_mixins.scss`): Use via `@use '@metaboost/ui/styles/mixins' as *;` (mixins depend on variables). Defined mixins:
  - `focus-ring` – keyboard focus outline (a11y); used by Button, Select, Input, NavBar, Dropdown, TableFilterBar
  - `disabled-state` – opacity + cursor; used by Button, Input, Textarea, Select
  - `at-least-sm`, `at-least-md`, `at-least-lg` – min-width media queries (mobile-first); `at-least-sm` used by ResourceTableWithFilter, NavBar
  - `clearfix`, `truncate` – available for use (float clear, text ellipsis)

Apps typically import `@metaboost/ui/styles` (or `globals.scss` that uses it); component `.module.scss` files import variables/mixins as needed.

## Component structure (`src/components/`)

| Directory       | Purpose                                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **form/**       | Form controls (Input, Select, CheckboxField, Textarea, PasswordStrengthMeter), form layout (FormContainer, FormSection, FormActions), buttons (Button, ButtonLink), CRUD UI (CrudButtons, CrudCheckboxes), auth forms. See `form/PACKAGES-UI-SRC-COMPONENTS-FORM.md`. |
| **layout/**     | Page structure and content: AppView, Main, Container, Stack, Row, Card, SectionWithHeading, PageHeader, ContentPageLayout, FilterTablePageLayout, BucketDetailPageLayout, CenterInViewport, CopyLinkBox, DataDetail, Divider, List, UnorderedList, Text.              |
| **modal/**      | Overlays: Modal, ConfirmDeleteModal, RateLimitModal, NavigationLoadingOverlay.                                                                                                                                                                                        |
| **navigation/** | NavBar, Breadcrumbs, Tabs, Link, BackToButton, Dropdown, Pagination, GoToPageModal, ThemeSelector, AppTypeTitle.                                                                                                                                                      |
| **table/**      | Data tables: Table, TableWithSort, TableFilterBar, TableWithFilter, ResourceTableWithFilter; sort prefs (sortPrefsCookie).                                                                                                                                            |
| **feedback/**   | LoadingSpinner, Tooltip, InfoIcon.                                                                                                                                                                                                                                    |
| **bucket/**     | Bucket-feature components: BucketDetailContent, BucketMessageList, MessageCard, BucketAdminsView, BucketSettingsTabs, BucketSettingsBreadcrumbs, BucketMessagesBreadcrumbs, BucketMessagesPageContent, BucketSettingsLayoutClient, EditBucketAdminForm.               |

New primitives (buttons, inputs, text) belong in **form/** or **layout/** as appropriate. New overlays in **modal/**; new nav in **navigation/**.

## Hooks (`src/hooks/`)

- **useDeleteModal** – Open/close state and handlers for a delete confirmation modal; used by ResourceTableWithFilter and any list that needs row delete + confirm. Export: `@metaboost/ui`.
- **useTableFilterState** – Filter state for table filter bars (column values, apply/reset). Export: `@metaboost/ui`.
- **useAuthValidation** – Auth-related validation (e.g. email/password with `validateEmailWithT`, `validatePasswordWithT`). Export: `@metaboost/ui`.

Use these when a component needs the same state + handler pattern; avoid one-off local state that duplicates the pattern. For app-specific submit/loading/error patterns, keep logic in the app or add a shared hook only if reuse is clear (e.g. 3+ call sites).
