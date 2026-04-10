# Alpha child applications placeholder

The open-source convention is to add Argo CD **`Application`** manifests in **your GitOps repo**
(e.g. `argocd/boilerplate-alpha/`), not under this path—so operators are not tempted to apply a
second, conflicting app-of-apps from the Boilerplate repo.

If you intentionally host alpha Applications **in** this repository, add child `Application` YAML
here and document the branch Argo CD must track; see
[`docs/development/ARGOCD-GITOPS-BOILERPLATE.md`](../../../../docs/development/ARGOCD-GITOPS-BOILERPLATE.md).
