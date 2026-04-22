### Session 1 - 2026-04-22

#### Prompt (Developer)

fix

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/17.txt:7-136 why is this warning happening in metaboost? can we fix it?

#### Key Decisions

- Remove legacy `esbuild.target` from Vitest config files that now run with OXC to eliminate noisy dual-transform warnings.

#### Files Modified

- apps/api/vitest.config.ts
- apps/management-api/vitest.config.ts
- apps/web/vitest.config.ts
- packages/metaboost-signing/vitest.config.ts
- packages/rss-parser/vitest.config.ts
- .llm/history/active/vitest-transform-warning-cleanup/vitest-transform-warning-cleanup-part-01.md
