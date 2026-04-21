# Copy/Paste Prompts

## Verify changed API contracts

Review Standard Endpoint capability GET responses and verify the following fields exist when `app_id` is supplied:

- `app_id_checked`
- `app_allowed`
- `app_block_reason`
- `app_block_message`

## Verify bucket blocked-app checklist flow

From web bucket settings (top-level bucket):

1. Open Blocked apps tab.
2. Uncheck an app and confirm a blocked row is created.
3. Re-check and confirm the blocked row is removed.
4. Confirm globally blocked apps are disabled with explanatory tooltip.

## Verify management global-block flow

From management-web blocked apps tab:

1. Toggle global block on for an app.
2. Confirm same app appears disabled on web bucket blocked-app list.
3. Toggle global block off and confirm app returns to editable state.
