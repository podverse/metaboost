-- Forward-only: append-only billing domain events for orchestration and audit.

CREATE TABLE billing_domain_event (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
      'payment_settled',
      'renewal_succeeded',
      'renewal_failed',
      'pay_on_demand_extension_requested'
    )),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at server_time_with_default NOT NULL
);

CREATE UNIQUE INDEX uq_billing_domain_event_idempotency_key
  ON billing_domain_event (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_billing_domain_event_user_created
  ON billing_domain_event (user_id, created_at DESC);

CREATE INDEX idx_billing_domain_event_type_created
  ON billing_domain_event (event_type, created_at DESC);
