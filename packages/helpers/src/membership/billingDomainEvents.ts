/**
 * Normalized billing domain event labels stored in `billing_domain_event.event_type`.
 */
export const BILLING_DOMAIN_EVENT_TYPES = {
  PAYMENT_SETTLED: 'payment_settled',
  RENEWAL_SUCCEEDED: 'renewal_succeeded',
  RENEWAL_FAILED: 'renewal_failed',
  PAY_ON_DEMAND_EXTENSION_REQUESTED: 'pay_on_demand_extension_requested',
} as const;

export type BillingDomainEventType =
  (typeof BILLING_DOMAIN_EVENT_TYPES)[keyof typeof BILLING_DOMAIN_EVENT_TYPES];
