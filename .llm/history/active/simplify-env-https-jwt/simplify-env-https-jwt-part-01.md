# simplify-env-https-jwt

## Metadata

- **Started**: 2026-04-28
- **Author**: Agent / Developer

---

### Session 2 - 2026-04-28

#### Prompt (Developer)

i think you misunderstood and messed things up further. the only part i wanted to revert was what you did for this prompt:

"STANDARD_ENDPOINT_REQUIRE_HTTPS - i don't think we want this at all. https should be required for production. https should not be required for development

STANDARD_ENDPOINT_TRUST_PROXY - i don't think we want this either. correct me if i'm wrong.

MANAGEMENT_API_JWT_ISSUER / MANAGEMENT_API_JWT_AUDIENCE - does podverse require this for JWT env vars? if not, then do not include this concept in metaboost either, for both app and management"

#### Key Decisions

- **Clarification**: The intended revert scope was only the “simplify env” implementation (optional Standard Endpoint HTTPS/trust-proxy env removal + Express `trust proxy` + JWT iss/aud removal)—not unrelated migration/docs work.
- **State**: After `git restore --source=HEAD` on simplify-touched paths, runtime behavior matches pre-simplify: `STANDARD_ENDPOINT_REQUIRE_HTTPS` / `STANDARD_ENDPOINT_TRUST_PROXY`, `validateStandardEndpointTrustProxyTopology`, JWT claim options and `API_JWT_ISSUER` / `API_JWT_AUDIENCE` / management equivalents.
- **Cleanup**: `ENV-VARS-CATALOG.md` and `ENV-VARS-REFERENCE.md` `DB_APP_ADMIN_USER` table cells aligned to `metaboost_app_admin` (migration naming); broad `git restore` had reset those catalog/reference rows to `user`.

#### Files Modified

- docs/development/env/ENV-VARS-CATALOG.md
- docs/development/env/ENV-VARS-REFERENCE.md
