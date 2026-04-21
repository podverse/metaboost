# Execution Order

1. Data model and ORM services.
2. Standard endpoint policy checks (GET pre-check and POST enforcement).
3. Bucket blocked-app CRUD routes/controllers and registry app list endpoint.
4. Web blocked-app settings UX.
5. Management global-block controls (API + management-web).
6. Contract updates (OpenAPI/i18n/docs/tests).
