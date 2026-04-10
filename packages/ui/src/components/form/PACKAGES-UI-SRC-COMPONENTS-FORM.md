# Form components

This directory is the **single home** for all form control components and form-specific layout in `@metaboost/ui`.

## Form controls (primitives)

- **Input** – text, email, password, etc.
- **Select** – dropdown / single select
- **CheckboxField** – checkbox with label
- **Textarea** – multi-line text
- **PasswordStrengthMeter** – password strength indicator

## Form layout and actions

- **FormContainer** – form wrapper (e.g. `onSubmit`, accessibility)
- **FormSection** – section with heading
- **FormActions** – submit/cancel button row
- **Form** / **FormLinks** / **SubmitError** – form scaffolding and links

## Buttons and CRUD UI

- **Button**, **ButtonLink** – primary actions and links
- **CrudButtons**, **CrudCheckboxes** – table row edit/delete and CRUD flags

## Composed forms

- **AuthForms** – LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm

Domain-specific composed forms (e.g. bucket admin edit) may live in feature directories (e.g. `components/bucket/`) and import these form controls and layout components from here. New form **primitives** or form **layout** components should be added under this directory.
