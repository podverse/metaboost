# startup-probe-runtime-config-delay

## Started

2026-05-03

## Context

Avoid spurious startup probe failures when the main web container probes the runtime-config sidecar port before the sidecar listens.

### Session 1 - 2026-05-03

#### Prompt (Developer)

make the minimal change needed to avoid this problem

#### Key Decisions

- Added `initialDelaySeconds: 5` to `startupProbe` on `web` and `management-web` containers that HTTP-get `/runtime-config` on the sidecar port (parity with Podverse).

#### Files Modified

- `infra/k8s/base/web/deployment.yaml`
- `infra/k8s/base/management-web/deployment.yaml`
