# Metaboost Security Remediation - Copy-Pasta Prompts

Use prompts in the execution order defined in `00-EXECUTION-ORDER.md`.

## Phase 1 (parallel)

Run these two in parallel, then wait for both to complete.

### Prompt A

Execute `.llm/plans/completed/metaboost-security-remediation/01-cors-fail-fast-and-auth-limiter-parity.md` exactly as written.  
Implement the changes and tests described there, then report results and residual risks.

### Prompt B

Execute `.llm/plans/completed/metaboost-security-remediation/02-return-url-validation-web-management-web.md` exactly as written.  
Implement the changes and tests described there, then report results and residual risks.

## Phase 2 (sequential)

After Phase 1 is fully complete, run:

### Prompt C

Execute `.llm/plans/completed/metaboost-security-remediation/03-rss-ssrf-network-guards.md` exactly as written.  
Implement the changes and tests described there, then report rollout considerations and any compatibility impacts.

## Phase 3 (sequential)

After Phase 2 is complete, run:

### Prompt D

Execute `.llm/plans/completed/metaboost-security-remediation/04-auth-token-transport-and-management-proxy-session-gate.md` exactly as written.  
Implement the changes and tests described there, then report results and residual risks.

## Phase 4 (sequential)

After Phase 3 is complete, run:

### Prompt E

Execute `.llm/plans/completed/metaboost-security-remediation/05-standard-endpoint-and-dependency-trust-hardening.md` exactly as written.  
Implement the changes and tests described there, then report rollout sequencing and operational prerequisites.

## Phase 5 (sequential closure)

After Phase 4 is complete, run:

### Prompt F

Execute `.llm/plans/completed/metaboost-security-remediation/06-regression-guards-and-security-test-backfill.md` exactly as written (closure phase).  
Implement the regression protections, complete verification, and provide a finding-to-fix closure matrix.
