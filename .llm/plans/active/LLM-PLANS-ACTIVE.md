# `.llm/plans/active/`

In-progress multi-step plan sets (one directory per feature or initiative). **Not** `.llm/templates/` — templates are blanks; this directory holds real plan instances.

- Keep each plan file under 300 lines; split into numbered files when larger.
- Use `00-EXECUTION-ORDER.md`, `COPY-PASTA.md`, and numbered plans per **plan-files-convention** skill.
- When executing a set, follow **plan-execution-completion-tracking** rule: mark COPY-PASTA prompts done,
  move each finished `NN-*.md` to `completed/<set>/`, then move the whole set to `plans/completed/`
  when all prompts are complete.
- See [LLM.md](/.llm/LLM.md).
