### Session 51 - 2026-04-13

#### Prompt (Developer)

i tried to add an RSS Channel to an RSS Network but i get this error. the "validation failed" erro rmessage is insufficient. the error message should display a more detailed and accurate error

#### Key Decisions

- Return precise RSS parser failure text as the top-level API `message` for both top-level and
  child RSS channel creation endpoints instead of generic `"Validation failed"`.
- Keep the structured `details` payload (`path: rssFeedUrl`) unchanged so existing consumers still
  receive field-level error metadata.
- Align integration test expectation to the concrete parser message for missing podcast GUID.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md

### Session 59 - 2026-04-13

#### Prompt (Developer)

debug

#### Key Decisions

- Fix runtime `ReferenceError: Stack is not defined` by adding the missing `Stack` import from
  `@metaboost/ui` in the bucket detail page where the new empty-state guidance uses `<Stack>`.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- apps/web/src/app/(main)/bucket/[id]/page.tsx

### Session 60 - 2026-04-13

#### Prompt (Developer)

it appears that the top level (in this case, RSS Network) bucket does not have a constrained width for Buckets view, but the RSS Channel bucket within it does have constrained width.

the Buckets table for both types of buckets should allow full width

also, the buckets table should not display at all if the 

No RSS item buckets yet. To generate item buckets from this feed, open Add to RSS, add the canonical podcast:metaBoost tag to your RSS channel, then run Verify Metaboost Enabled.
Open Add to RSS tab

info should display. when that message should display, the message should simply display and not be presented within the table component

#### Key Decisions

- Remove readable max-width constraint for RSS channel Buckets-tab content by adding a configurable
  `messagesSlotMaxWidth` prop to `BucketDetailContent` and setting it to full width for that tab.
- Render RSS verification guidance as plain content (text + link) without table/header wrappers when
  guidance is shown; keep table rendering for normal RSS item lists and generic empty states.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- packages/ui/src/components/bucket/BucketDetailContent/BucketDetailContent.tsx
- apps/web/src/app/(main)/bucket/[id]/page.tsx

### Session 55 - 2026-04-13

#### Prompt (Developer)

the code snippet element needs to wrap contents. also if a reusable code block component does not already exist, it should be used here as we may have other snippets like this with a copy button in the future

#### Key Decisions

- Introduce a reusable UI component for copyable code snippets (`CodeSnippetBox`) in `@metaboost/ui`
  so future snippet+copy use cases can reuse the same wrapping and copy UX.
- Replace the one-off `<pre><code>` + custom copy logic in the Add-to-RSS panel with `CodeSnippetBox`
  so long canonical tags wrap cleanly and remain easy to copy.
- Add a Storybook story for `CodeSnippetBox` to document and verify default usage.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- apps/web/src/app/(main)/bucket/[id]/AddToRssPanel.tsx
- packages/ui/src/components/layout/CodeSnippetBox/CodeSnippetBox.tsx
- packages/ui/src/components/layout/CodeSnippetBox/CodeSnippetBox.module.scss
- packages/ui/src/components/layout/CodeSnippetBox/CodeSnippetBox.stories.tsx
- packages/ui/src/components/layout/CodeSnippetBox/index.ts
- packages/ui/src/index.ts
- apps/api/src/controllers/bucketsController.ts
- apps/api/src/test/buckets.test.ts

### Session 52 - 2026-04-13

#### Prompt (Developer)

Fix RSS Parser Large-Feed Failure

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Disable XML entity processing in the minimal RSS parser to prevent entity expansion limit failures on
  large real-world feeds while preserving required field extraction (`channelTitle`, `podcast:guid`).
- Add a parser regression test that uses >1000 XML entities to lock in support for entity-heavy feeds.
- Add API integration coverage proving RSS Channel creation succeeds for entity-heavy feeds and that
  parser-provided error messages are returned verbatim (including field-level detail messages).

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- packages/rss-parser/src/parseMinimalRss.ts
- packages/rss-parser/src/index.test.ts
- apps/api/src/test/buckets.test.ts

### Session 53 - 2026-04-13

#### Prompt (Developer)

why am i getting the error now?

#### Key Decisions

- Remove all temporary debug instrumentation from API controller and RSS parser source now that the
  runtime issue is confirmed fixed.
- Rebuild `@metaboost/rss-parser` so generated `dist` artifacts no longer contain debug log code.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- apps/api/src/controllers/bucketsController.ts
- packages/rss-parser/src/parseMinimalRss.ts
- packages/rss-parser/dist/parseMinimalRss.js
- packages/rss-parser/dist/parseMinimalRss.js.map

### Session 54 - 2026-04-13

#### Prompt (Developer)

The issue has been fixed. Please clean up the instrumentation.

#### Key Decisions

- Fix Sass compile failure in `CodeSnippetBox` by replacing undefined token `$font-family-mono`
  with existing shared token `$font-family-base` from `styles/_variables.scss`.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- packages/ui/src/components/layout/CodeSnippetBox/CodeSnippetBox.module.scss

### Session 56 - 2026-04-13

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/15.txt:394-466 fix the error/s

#### Key Decisions

- Add a shared monospace font token (`$font-family-mono`) to UI variables for reusable code/snippet
  typography and switch `CodeSnippetBox` to use it.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- packages/ui/src/styles/_variables.scss
- packages/ui/src/components/layout/CodeSnippetBox/CodeSnippetBox.module.scss

### Session 57 - 2026-04-13

#### Prompt (Developer)

implement the font-family-mono

#### Key Decisions

- Show a targeted empty-state explanation for RSS channel Buckets tab when item buckets are empty and
  RSS verification has not yet completed (`rssVerified` is null/undefined), including a direct link to
  the Add-to-RSS tab.
- Keep existing generic `noBucketsYet` behavior for other empty states so non-RSS-channel and already
  verified scenarios remain unchanged.
- Add translation keys in both `en-US` and `es` originals (plus Spanish overrides placeholders), and
  extend bucket-owner RSS Add-to-RSS E2E coverage to assert the new guidance text and link.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/web/e2e/bucket-rss-add-tab-bucket-owner.spec.ts

### Session 58 - 2026-04-13

#### Prompt (Developer)

RSS Channel Buckets Empty-State Guidance

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- In progress.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-05.md
