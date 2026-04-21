# Standard Endpoint — post-rollout validation report

**Template:** Copy this file per rollout; fill in all **Required** sections. Store with the release
artifacts (internal wiki, ticket, or repo docs folder as policy allows).

**Runbook:** [STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md](./STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md)

---

## Metadata (Required)

| Field                                            | Value                       |
| ------------------------------------------------ | --------------------------- |
| **Report ID**                                    |                             |
| **Environment**                                  | (e.g. staging / production) |
| **Date (UTC)**                                   |                             |
| **Metaboost version / git ref**                  |                             |
| **metaboost-registry ref (merge commit or tag)** |                             |
| **Minimum `metaboost-signing` semver verified**  | (e.g. 0.2.1)                |
| **Author**                                       |                             |

## Executive summary (Required)

- **Go / No-Go:** (Go | No-Go)
- **One paragraph:** What was validated and the outcome.

## Gates satisfied (Required)

Check each gate from the runbook **G0–G4**; attach evidence links or command output paths.

| Gate                      | Satisfied (Y/N) | Evidence / notes |
| ------------------------- | --------------- | ---------------- |
| G0 Decision locks         |                 |                  |
| G1 Registry readiness     |                 |                  |
| G2 Public npm helpers     |                 |                  |
| G3 Metaboost verification |                 |                  |
| G4 Docs and examples      |                 |                  |

## Compatibility matrix results (Required)

Fill from [runbook section 2](./STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md#2-compatibility-matrix).

| Scenario                            | Pass (Y/N) | Notes |
| ----------------------------------- | ---------- | ----- |
| Signed required → unsigned rejected |            |       |
| Invalid / malformed signature       |            |       |
| Binding mismatch                    |            |       |
| Replay (`jti`)                      |            |       |
| App not registered                  |            |       |
| App suspended                       |            |       |
| HTTPS vs insecure (non-local)       |            |       |

## Smoke checklist (Required)

From [runbook section 3](./STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md#3-end-to-end-smoke-checklist-non-production).

| Step                | Pass (Y/N) | Notes |
| ------------------- | ---------- | ----- |
| 1 Register app      |            |       |
| 2 Integrate helpers |            |       |
| 3 Sign and POST     |            |       |
| 4 Confirm success   |            |       |
| 5 Negative checks   |            |       |

## Observability snapshot (Required)

| Metric / check                            | Value or “N/A” | Notes |
| ----------------------------------------- | -------------- | ----- |
| Auth failure rate baseline vs post-deploy |                |       |
| Registry fetch health window              |                |       |
| Log filter by `iss` (app id)              |                |       |

## Rollback drill (Required for first production cutover)

| Drill                            | Performed (Y/N) | Date | Outcome |
| -------------------------------- | --------------- | ---- | ------- |
| Configuration rollback path      |                 |      |         |
| Consumer package pin / downgrade |                 |      |         |

## Issues and follow-ups

| ID  | Severity | Description | Owner |
| --- | -------- | ----------- | ----- |
|     |          |             |       |

## Sign-off (Required for production)

| Role                             | Name | Date |
| -------------------------------- | ---- | ---- |
| Engineering                      |      |      |
| Operations / SRE (if applicable) |      |      |
