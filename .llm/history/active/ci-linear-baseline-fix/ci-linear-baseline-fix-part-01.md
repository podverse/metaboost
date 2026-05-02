# ci-linear-baseline-fix

Started: 2026-05-02

### Session 1 - 2026-05-02

#### Prompt (Developer)

fix

#### Key Decisions

- Fix CI failure in `Verify generated linear baseline artifacts` by regenerating committed `0003a`/`0003b` baseline archives from the current linear migration chain.
- Validate the regenerated artifacts with the repository verification target before handing back.

#### Files Modified

- .llm/history/active/ci-linear-baseline-fix/ci-linear-baseline-fix-part-01.md
- infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz
