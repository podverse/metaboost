---
name: observability
description: Distributed tracing and OTLP export patterns. Use when adding trace context, log correlation, or Observability env — after Metaboost adopts a shared observability package.
version: 1.0.0
---

# Observability (distributed tracing)

## When to use

- Planning or implementing **OpenTelemetry** tracing, log `trace_id` / `span_id` correlation, or
  W3C propagation on outbound HTTP
- Adding **Observability** env keys (`OTEL_SERVICE_NAME`, `OTEL_TRACES_EXPORT`, …) to templates

## Current state (Metaboost)

Metaboost does **not** yet ship a `@metaboost/observability` package or Express bootstrap middleware
like Podverse. Apps log via console helpers today. Treat this skill as the **target pattern** when
tracing is added; do not invent `config.extensions.tracing` toggles.

## Target architecture (when adopted)

| Item        | Rule                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| Always on   | Trace context in-process even when export is `none`                    |
| Config      | Dedicated `config.observability.*` (not mixed into unrelated extensions) |
| Env         | Observability subsection in app `.env.example` and K8s `source/*.env`   |
| Middleware  | HTTP tracing middleware after standard body/auth middleware            |

**Separate from metrics:** If Prometheus scrape or OTLP metrics are added later, keep metrics SDK
and tracing bootstrap as distinct concerns.

## Env vars (future template shape)

| Variable                      | Notes                          |
| ----------------------------- | ------------------------------ |
| `OTEL_SERVICE_NAME`           | Workload name                  |
| `OTEL_TRACES_EXPORT`          | `none` or `otlp`               |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Required when export is `otlp` |

## Don't

- Gate basic W3C trace context behind optional extension toggles
- Put trace export logic inside unrelated metrics sidecars without an explicit design

## References

- Podverse reference: `podverse/.cursor/skills/observability/SKILL.md` and
  `docs/operations/observability/TRACING.md` (when porting)
- **feature-implementation-testing** — add tests when observability changes affect API behavior
- **k8s** skill — env typing in manifests
