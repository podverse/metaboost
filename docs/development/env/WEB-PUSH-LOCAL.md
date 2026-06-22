# Web Push (VAPID) — local development

## Generate keys

From the Metaboost repository root:

```bash
bash scripts/development/generate-webpush-vapid-keys.sh
```

This runs `npm run webpush:generate-vapid-keys -w @metaboost/api` (the `web-push` CLI) and prints a **public** and **private** key pair.

## Wire env

1. **API** — set canonical variables (see `apps/api/.env.example`):
   - `WEBPUSH_VAPID_PUBLIC_KEY` — paste the generated public key.
   - `WEBPUSH_VAPID_PRIVATE_KEY` — paste the generated private key (secret).
   - `WEBPUSH_VAPID_SUBJECT` — typically `mailto:you@example.com` or an `https:` contact URL (required by the web-push library).
   - `WEBPUSH_ENABLED` — optional; set to `false` to disable outbound Web Push without removing keys.

   Legacy names `API_WEB_PUSH_VAPID_PUBLIC_KEY`, `API_WEB_PUSH_VAPID_PRIVATE_KEY`, and `API_WEB_PUSH_VAPID_CONTACT` are still read if the `WEBPUSH_*` keys are unset.

2. **Web runtime** — the browser needs the **same public** key via runtime config (sidecar):
   - `NEXT_PUBLIC_WEBPUSH_VAPID_PUBLIC_KEY` (canonical), or legacy `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`.

   Optional: `NEXT_PUBLIC_WEBPUSH_ENABLED=false` hides the bucket notification bell without changing API behavior.

3. **Home overrides** — optional file `notifications.env` (see [LOCAL-ENV-OVERRIDES.md](LOCAL-ENV-OVERRIDES.md)) can hold `WEBPUSH_*` keys. After `make local_env_setup`, `scripts/local-env/setup.sh` copies them into the API app env and syncs the public key to web sidecar keys.

## Verify

- API starts without VAPID keys (push is simply skipped).
- With keys set, subscribe from a bucket page and confirm the service worker receives pushes when new messages are sent (see deployment docs for HTTPS requirements).
