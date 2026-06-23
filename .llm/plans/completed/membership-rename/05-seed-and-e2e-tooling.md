# 05 — Seed and E2E tooling

## Scope

Local dev bootstrap user and Playwright E2E seed use `user_membership`. Integrates deferred login fix for `localdev@example.com`.

## Steps

1. **Local Docker bootstrap** [infra/k8s/base/db/source/bootstrap/0008_seed_local_user.sql](infra/k8s/base/db/source/bootstrap/0008_seed_local_user.sql):
   - After `user_bio`, insert premium membership with long expiry:

```sql
WITH u AS (SELECT user_id AS id FROM user_credentials WHERE email = 'localdev@example.com')
INSERT INTO user_membership (user_id, membership_tier, membership_expires_at, auto_renew)
SELECT id, 'premium', NOW() + INTERVAL '100 years', false FROM u
ON CONFLICT (user_id) DO NOTHING;
```

   - Keep `user_terms_acceptance` insert for terms gate.

2. **E2E seed** [tools/web/seed-e2e.mjs](tools/web/seed-e2e.mjs):
   - `INSERT INTO user_membership` (replace `user_trust_settings`)

## Operator — existing local DB (before re-init)

After code deploy, if the volume still has `user_trust_settings`, **re-init** is the clean path:

```bash
make local_db_init
```

Or one-off on fresh schema (`user_membership` table):

```bash
docker exec -i metaboost_local_postgres psql -U metaboost_app_owner -d metaboost_app <<'SQL'
WITH u AS (SELECT user_id AS id FROM user_credentials WHERE email = 'localdev@example.com')
INSERT INTO user_membership (user_id, membership_tier, membership_expires_at, auto_renew)
SELECT id, 'premium', NOW() + INTERVAL '100 years', false FROM u
ON CONFLICT (user_id) DO NOTHING;
SQL
```

Clear cookies for `http://localhost:4002` and log in with `localdev@example.com` / `Test!1Aa`.

## Verification

```bash
make e2e_seed
make e2e_test_web_report_spec SPEC=e2e/auth-stale-cookies-redirect-login.spec.ts
```

Open `.artifacts/e2e-reports/latest/web/index.html`.
