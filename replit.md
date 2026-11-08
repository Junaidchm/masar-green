# Masar Green

Bilingual Dubai smart-mobility and carbon-rewards concept prototype.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required app env: `SESSION_SECRET`; managed services provide `PORT` and `BASE_PATH`.
- App data uses SQLite, explicitly requested by the user. Do not migrate it to PostgreSQL without asking.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- App DB: better-sqlite3, auto-seeded local prototype data. Existing unused PostgreSQL library is left intact.
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Client: `artifacts/masar-green/src`
- Server/domain: `artifacts/api-server/src/masar`
- API contract: `lib/api-spec/openapi.yaml`; regenerate after changes.
- Full run instructions, demo accounts and limitations: `README.md`

## Architecture decisions

- Preserve the provided workspace rather than duplicate client/server trees.
- A clearly labelled guest preview uses seeded demo data; mutations require actual sign-in.
- Local card/PIN auth is explicitly requested for a simulation only, not an official NOL login.
- Ledger audit data and hashed abuse checks survive history deletion, with journey descriptions removed.

## Product

- Simulated trip planning, live transit, carbon calculations, wallet rewards, challenges, community and role-protected anonymised reports.

## User preferences

- English/Arabic with RTL, UAE palette, mobile-first, light/dark.
- Never use official RTA/NOL logos or imply government affiliation.
- All transport, verification and money flows are simulations; bank withdrawal is coming soon.

## Gotchas

- Secure cookies require the proxied HTTPS origin. Do not log PINs or cookie values.
- Do not cache authenticated API responses in the PWA.
- SQLite is prototype-local; do not promise durable production money or card balances.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
