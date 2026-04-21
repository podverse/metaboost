# 08 - Developer End-To-End Guides (Helpers)

## Scope

Provide clear developer-facing docs for the full npm-helper integration path:

1. register app/public key in registry;
2. install signing helpers package in backend API;
3. generate signed headers in backend;
4. send signed `POST` requests to Metaboost **`/v1/standard/*`** routes (Standard Endpoint).

## Outcomes

- Integrators can complete setup with minimal support.
- Trust boundaries are explicit (client vs backend responsibilities).
- Common implementation mistakes are preemptively addressed.

## Steps

1. Add integration guide:
   - [`/Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md) (onboarding and troubleshooting; keep assertion/header details consistent with [`STANDARD-ENDPOINT-APP-SIGNING.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-APP-SIGNING.md))
2. Add helper package installation and usage path:
   - install package;
   - initialize signing inputs;
   - attach `Authorization` header to outbound request.
3. Link registry onboarding docs and app approval flow.
4. Add troubleshooting section:
   - signature mismatch;
   - replay errors;
   - app suspended/unregistered;
   - HTTPS enforcement failures.

## Required Guide Sections

- Prerequisites
- Registry onboarding
- Backend helper integration
- Request-signing flow
- Calling `/v1/standard/*` endpoints
- Error handling and retries
- Security best practices

## Verification

- A new integrator can follow docs and produce a valid signed request.
- Examples align with helper API names and verifier contract.
