# ClashSync

Paste your Clash of Clans **Export Village** JSON and see every running upgrade (builders, lab, pet house, builder base) with exact finish times. Apply Builder/Research Potions and get Discord alerts before timers finish.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL, BETTER_AUTH_SECRET, Discord keys, …
pnpm db:migrate              # apply drizzle/ migrations to your Neon database
pnpm dev                     # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `pnpm test` | Unit + integration tests (in-memory Postgres built from the migrations) |
| `pnpm lint` | ESLint |
| `pnpm screenshots` | Captures every UI state (needs `pnpm dev` running) |
| `pnpm db:generate --name <change>` | New migration after editing `lib/db/schema.ts` |
| `pnpm qstash:schedule <public-url>` | Creates the alert sweep schedule (once per deployment) |

Stop `pnpm dev` before `pnpm build`, because both use `.next/`.

## Docs

- `CLAUDE.md`: full developer guide (stack, layout, domain rules, roadmap)
- `CONTEXT.md`: short guide for AI agents, including the database schema
- `docs/PROJECT_OVERVIEW.md`: original product plan plus "as built" notes

Not affiliated with Supercell.
