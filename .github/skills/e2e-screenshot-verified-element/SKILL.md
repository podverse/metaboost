---
name: e2e-screenshot-verified-element
description: When an E2E test verifies a specific element, pass it to the capture helper so the step screenshot is taken with that element vertically centered.
version: 1.0.0
---

# E2E Screenshot: Center Verified Element

Use this skill when adding or editing E2E specs in `apps/web/e2e/` or `apps/management-web/e2e/` when the test verifies a specific element (visibility, content, state, or absence of a control) and then takes a step screenshot.

## Rule

When the goal of the step is to document verification of a **specific element**, pass that element as the optional `scrollToElement` argument to `capturePageLoad` or `actionAndCapture` so the screenshot is taken with that element **vertically centered** in the viewport. This makes the report show what was actually asserted.

## Examples

- Test asserts "owner row has no delete button" then captures → pass the owner row locator as the 4th argument to `capturePageLoad(page, testInfo, label, ownerRow)`.
- Test performs an action then asserts on a specific table or form and captures → pass that table/form locator to `actionAndCapture(page, testInfo, label, action, scrollToElement)`.

## When not to pass

Generic "page loaded" or "navigation completed" captures with no single asserted element do not need `scrollToElement`; leave the parameter omitted.
