---
name: time-format-local
description: Ensures client-side time displays use formatDateTimeReadable for localized, readable timestamps. Use when rendering dates/times in the UI or when the user mentions time formatting or local timezone display.
---

# Local Time Formatting

## Instructions

- For client-side UI that displays a time to users, use **`formatDateTimeReadable`** from **`@metaboost/helpers-i18n/client`**.
- Pass the active locale (typically from **`useLocale()`** / **`next-intl`**) as the **first** argument.
- This ensures readable timestamps rendered in the user's local timezone with project-supported locales.

## Example

```tsx
'use client';

import { formatDateTimeReadable } from '@metaboost/helpers-i18n/client';
import { useLocale } from 'next-intl';

const locale = useLocale();
const label = formatDateTimeReadable(locale, lastMessageAt);
```

## Options

`formatDateTimeReadable` accepts optional **`FormatDateTimeOptions`** (`dateStyle`, `timeStyle`, `includeTimezone`) when a shorter or timezone-free display is needed.

## Don't

- Do not use raw `Date.toLocaleString()` without going through the shared helper — locale validation and defaults live in **`packages/helpers-i18n`**.
