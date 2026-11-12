# Security Policy

## Scope

Masar Green is a **concept prototype**. It is not affiliated with RTA, NOL or any government entity, and it does not process real transport, payment or identity data. The security model is intentionally limited and is documented below so nobody mistakes the demo for a production service.

## Supported versions

This repository is a single prototype snapshot. There are no maintained release branches. Security fixes, if any, are applied to `main`.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

- Use GitHub's private vulnerability reporting on this repository (**Security → Report a vulnerability**), or
- Contact the repository owner through their GitHub profile.

Include the affected file or endpoint, reproduction steps, and the impact you believe it has. This is a volunteer prototype, so responses are best-effort.

## Known prototype boundaries

These are deliberate limitations, not undisclosed vulnerabilities:

- **Simulated identity.** Any 8–10 digit card number can create a local demo account with a chosen PIN. This does not verify NOL card ownership.
- **Public demo credentials.** The seeded card/PIN pairs in the README are intentionally public. They only access simulated data.
- **Local SQLite storage.** The database is disposable, single-process and not backed up. Do not store real personal or financial records in it.
- **Process-local rate limits.** Sign-in, engagement and assistant limits reset on restart and are not distributed.
- **Browser-workspace isolation.** Free-text feedback and sponsorship cases are scoped to a random browser cookie in addition to the account. This is a demo compromise, not private staff authentication.
- **Optional AI provider.** Assistant messages are sent to the configured OpenAI-compatible provider. The app does not persist chat history, but provider retention is outside its control. Basic screening rejects likely card numbers, PINs and email addresses; it is not a complete personal-data detector.
- **Simulated money and carbon.** Green Credits, AED values, tree equivalence, NOL top-ups and partner vouchers have no monetary or environmental effect.

## Operational guidance

- Set a long random `SESSION_SECRET`; never commit it.
- Keep `NODE_ENV=production` in deployed environments so session cookies are `Secure`.
- Never expose `AI_INTEGRATIONS_OPENAI_API_KEY` to the browser.
- Do not reuse the demo authentication model with real users, real cards or real payments.
