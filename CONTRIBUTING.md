# Contributing

Masar Green is a concept prototype built during a hackathon. It is published for evaluation and learning, not as a production service. Contributions that keep the prototype honest, runnable and clearly labelled are welcome.

## Before you start

- Read [`README.md`](README.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- Treat all transport, NOL, reward, partner and payment data as simulated. Do not add claims or features that imply an official RTA, NOL or government integration.
- Do not commit secrets, real personal data, real card numbers, `.env` files or the local SQLite database.

## Development setup

```sh
corepack enable
pnpm install
```

Run the API and web app in separate terminals as described in the README. The API needs `SESSION_SECRET`; the AI assistant is optional.

## Making a change

1. Create a focused branch from `main`.
2. Keep the change small and scoped. Preserve the existing structure and naming.
3. If you change `lib/api-spec/openapi.yaml`, regenerate the client and validators:

   ```sh
   pnpm --filter @workspace/api-spec run codegen
   ```

4. Run the checks before opening a pull request:

   ```sh
   pnpm run typecheck
   pnpm test
   pnpm run build
   ```

5. Describe what changed and why. Call out any simulation boundary or privacy impact.

## Commit messages

Use short, imperative [Conventional Commits](https://www.conventionalcommits.org/) subjects, for example:

```text
feat(web): add step-free route filter
fix(api): keep session cookie non-Secure in local development
docs: clarify carbon factor assumptions
```

## Simulation and privacy rules

- Label new simulated behaviour clearly in the UI and documentation.
- Do not weaken the aggregate-report suppression or the browser-workspace isolation for free-text cases.
- Do not add tracking, analytics or third-party calls that collect personal data without an explicit, documented decision.
- Keep the AI assistant read-only unless there is a reviewed design for tool access.

## Reporting security issues

Please follow [`SECURITY.md`](SECURITY.md) instead of opening a public issue.

## License

By contributing, you agree that your contribution is released under the [MIT License](LICENSE).
