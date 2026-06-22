# `.llm/context/`

Shared codebase summaries for contributors (for example architecture and conventions). Reference material — not standing agent rules.

- [`architecture.md`](architecture.md) holds the full tier table; the always-applied rule `.cursor/rules/architecture-tier-dependencies.mdc` states the dependency constraint for agents.
- [`conventions.md`](conventions.md) summarizes TypeScript, import, and plan conventions; see [AGENTS.md](/AGENTS.md) for full detail.
- When a summary encodes a standing constraint agents must follow, add or extend an always-applied `.cursor/rules/*.mdc` and link here for the full table or narrative.
- Put durable, repo-wide context here when it helps people orient quickly.
- Do not duplicate content that belongs in skills, rules, or `docs/`.
- See [LLM.md](/.llm/LLM.md).
