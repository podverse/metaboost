# GitOps cutover checklist (staging first)

Operator-run steps when rolling **thin overlays** and **remote bases** to a live cluster (e.g.
Metaboost alpha on a shared cluster). Adapt names (`<env>`, GitOps repo URL, namespace) to your
fork.

Staging should pass this list before you treat production cutover as routine.

1. **Tag the current GitOps tree** — Create a git tag on the current `apps/metaboost-<env>/`
   revision (rollback anchor), e.g. `git tag metaboost-alpha-pre-remote-bases-<date>` and push
   tags.

2. **Land Metaboost bases** — Merge or tag the branch that contains `infra/k8s/base/<component>/`.
   Note the **branch or tag**; GitOps `resources` URLs use `?ref=<that-revision>`.

3. **Point one overlay at the new ref** — In the GitOps repo, set `ref` on a **single** component’s
   remote base to the new Metaboost revision; commit, push, sync that Application in Argo CD;
   confirm pods become **Healthy**.

4. **Roll remaining components** — Update `ref` (or merge a single commit that updates all remote
   bases), push, sync in dependency order (see [REMOTE-K8S-GITOPS.md](REMOTE-K8S-GITOPS.md) Step 11).

5. **TLS and public URLs** — Confirm ingress certificates and hostnames for your **public** domains
   (Podverse alpha uses **metaboost.cc** while manifests live in **k.podcastdj.com**). Run API
   health checks and open web / management-web in a browser; confirm **CORS** and **cookie** settings
   match those hosts (`make alpha_env_render` / overrides must agree with ingress).

6. **Pin `ref` for stability** — After smoke tests, point remote bases at an **immutable tag** (or
   long-lived release branch) instead of a moving dev branch if that is your policy.

7. **Rollback** — Revert the GitOps commit (or reset overlays to the pre-cutover tag), push, and
   sync Argo CD; confirm workloads return to the previous revision.

**Cluster execution:** This checklist is not automated in CI; mark each step when your team has run
it against the target cluster.
