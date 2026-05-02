# argocd-github-repo-secret

## Context

Vendored Argo CD GitHub repository credential generator under Metaboost secret-generators for forks.

---

### Session 1 - 2026-05-02

#### Prompt (Developer)

we aren't concerned with divergence we just want the file in each of the repos today

#### Key Decisions

- Added `infra/k8s/scripts/secret-generators/create_argocd_github_repo_secret.sh` (same behavior as operator GitOps copy).
- Extended `INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md` and `REMOTE-K8S-GITOPS.md` with operator-neutral cross-repo wording.

#### Files Created/Modified

- `infra/k8s/scripts/secret-generators/create_argocd_github_repo_secret.sh`
- `infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`
- `docs/development/k8s/REMOTE-K8S-GITOPS.md`
- `.llm/history/active/argocd-github-repo-secret/argocd-github-repo-secret-part-01.md`

---

### Session 2 - 2026-05-02

#### Prompt (Developer)

implement

#### Key Decisions

- Same URL-first interactive refactor as Podverse copy (`VERSION` 2); INFRA doc examples drop `--preset`; `--help` parsed before dependency checks.

#### Files Created/Modified

- `infra/k8s/scripts/secret-generators/create_argocd_github_repo_secret.sh`
- `infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`
- `.llm/history/active/argocd-github-repo-secret/argocd-github-repo-secret-part-01.md`

---

### Session 3 - 2026-05-02

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/30.txt:7-53 how can i align the alpha.podcastdj.com argoc repo secret and the v4v-io-metaboost-cc-argoc-repo secret? i still see github-pat-classic-secret.enc.yaml locally but i think we want consistency with the new way metaboost handles this? change all related files across 4 repos as needed. i will need specific steps to update the existing k8s which uses github-pat-classic-secret for alpha.podcastdj.com

#### Key Decisions

- Extended REMOTE-K8S-GITOPS + INFRA with slug-based repo-secret naming and argocd-only namespace note (parallel operator-repo doc updates in k.podcastdj.com / metaboost.cc).

#### Files Created/Modified

- `infra/k8s/scripts/secret-generators/create_argocd_github_repo_secret.sh`
- `infra/k8s/scripts/secret-generators/INFRA-K8S-SCRIPTS-SECRET-GENERATORS.md`
- `docs/development/k8s/REMOTE-K8S-GITOPS.md`
- `.llm/history/active/argocd-github-repo-secret/argocd-github-repo-secret-part-01.md`

---

### Session 4 - 2026-05-02

#### Prompt (Developer)

update the generator script so that it explains exactly how to create the PAT needed at the step where it asks for the PAT

#### Key Decisions

- Same PAT onboarding block and `VERSION` 3 as Podverse copy.

#### Files Created/Modified

- `infra/k8s/scripts/secret-generators/create_argocd_github_repo_secret.sh`
- `.llm/history/active/argocd-github-repo-secret/argocd-github-repo-secret-part-01.md`

---

### Session 5 - 2026-05-02

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/30.txt:166-184 this script should not explain the wrong path, it should only explain the correct path

#### Key Decisions

- PAT prompt lists correct GitHub steps only; `VERSION` 4.

#### Files Created/Modified

- `infra/k8s/scripts/secret-generators/create_argocd_github_repo_secret.sh`
- `.llm/history/active/argocd-github-repo-secret/argocd-github-repo-secret-part-01.md`
