---
name: password-strength-on-set-update
description: On every page where a password can be set or updated, include the PasswordStrengthMeter component.
---

# Password strength on set/update

**When to use:** When adding or changing any form or page where a user can set a new password or update their password (signup, create user, create admin, change password, reset password, etc.).

## Rule

Include the **PasswordStrengthMeter** component (from `@metaboost/ui`) on every page where a password can be set or updated:

- Place it directly after the **new password** input field (the field that is being set or changed). For "change password" flows with current + new + confirm, the meter goes after the new-password field and before the confirm field.
- Pass the current value of the new-password field: `<PasswordStrengthMeter password={newPassword} />`.
- **Always render the meter** (do not condition on `password !== ''`). When empty, the component still shows requirements and an empty bar so the user sees it is present; when they type, the strength updates. Hiding the meter when the field is empty makes the page look like it has no strength indicator.

## Where it applies

- **Signup / create account:** After the password (or main password) field.
- **Create user (management):** UserForm create mode — after password input.
- **Edit user – change password:** UserForm edit mode — after new password input.
- **Create admin (management):** AdminForm — after password input.
- **Edit admin – change password:** AdminForm edit mode — after password input (when shown).
- **Settings – change password:** Management-web SettingsContent and web SettingsPageContent — after new password input.
- **Reset password:** ResetPasswordForm — after new password input (already present in UI package).

## References

- Component: `packages/ui/src/components/form/PasswordStrengthMeter/`
- Examples: `UserForm.tsx`, `AdminForm.tsx`, `SignupForm.tsx`, `ResetPasswordForm.tsx`, `SettingsContent.tsx`, `SettingsPageContent.tsx`.
