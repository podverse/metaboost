# Execution order - Metaboost Bucket Webpush Foundation

**Copy-paste prompts:** [COPY-PASTA.md](./COPY-PASTA.md)

## Phase order

1. [01-backend-domain-and-schema.md](./01-backend-domain-and-schema.md) (completed)
2. [02-api-and-webpush-channel.md](./02-api-and-webpush-channel.md) (completed)
3. [03-web-ui-and-service-worker.md](./03-web-ui-and-service-worker.md) (completed)
4. [04-env-vapid-and-local-setup.md](./04-env-vapid-and-local-setup.md) (completed)
5. [05-tests-and-verification.md](./05-tests-and-verification.md) (completed)

## Why this order

- Backend schema and inheritance rules must land first so API and UI can use stable contracts.
- API endpoints and channel orchestration come next to establish end-to-end behavior.
- Web UI work follows once APIs exist (bell toggle, modal scope choice, subscription flow).
- Env and VAPID wiring is finalized after code paths are known.
- Tests and verification run last to validate complete behavior across API and web.