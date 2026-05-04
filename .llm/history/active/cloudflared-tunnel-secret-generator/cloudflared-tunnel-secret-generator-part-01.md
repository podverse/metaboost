# cloudflared-tunnel-secret-generator

## Started

2026-05-03

### Session 1 - 2026-05-03

#### Prompt (Developer)

add the k.podcastdj.com tunnel secret generator to podverse and metaboost

#### Key Decisions

- Added `create_cloudflared_tunnel_secret.sh` (same defaults as Podverse: **`external-infra`**, **`tunnel-token`**, SOPS to **`./secrets/cloudflared-tunnel-secret.enc.yaml`**).
- Documented Cloudflare Tunnel section in secret-generators INFRA doc; added to individual-scripts list and `create_all_secrets_auto_gen.sh` manual list.

#### Files Created/Modified

- `infra/k8s/scripts/secret-generators/create_cloudflared_tunnel_secret.sh`
- `infra/k8s/scripts/secret-generators/create_all_secrets_auto_gen.sh`
- `infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`
