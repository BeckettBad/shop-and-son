# Agent instructions for Shop & Sons Operations

## Required reading

Before acting, read:

1. `../../README.md`, `../../BUSINESS-STATE.md`, and `../../WORKSTREAM-STANDARD.md` for BaderBureau direction and governance.
2. `../AGENTS.md` and `../README.md` for the containing repository’s live-site and branch rules.
3. This workstream’s `README.md` for architecture, runbooks, safety boundaries, and production procedure.
4. This workstream’s `STATE.md` for current status, ownership, blockers, verification, and handoff.
5. `PRODUCTION-READINESS.md` before evaluating credentials, deployment, rollback, or production readiness.

If uncertainty could affect publishing, credentials, production resources, customer data, money, repository history, or deletion, stop and ask Beckett.

## Scope and safety

- This workstream owns the separate Operations Worker, D1 schema, health/incident pipeline, private dashboard, aggregate reporting, notification relay, and privacy-minimized storefront telemetry contract.
- The existing homepage and now-playing Worker remain separate systems. Touch them only where `README.md` explicitly defines an integration boundary.
- Never print, paste, commit, or expose credentials. Use ignored local files, Wrangler’s interactive secret prompt, or macOS Keychain as documented.
- Do not create remote resources, apply remote migrations, deploy, configure Cron/Access/rate-limit rules, install the LaunchAgent, send an iMessage, change Shopify scopes, publish the storefront, commit, push, or merge without the required approval.
- Keep `EVENT_COLLECTION_ENABLED=false` until the approved edge collector rate limit is configured and verified.
- Prefer reviewed forward D1 migrations. Never import a full export over a populated production database.

## Engineering rules

- Preserve exact event schemas and the prohibition on PII, raw URLs, query strings, free-form customer content, identifiers, and upstream payload persistence.
- Keep analytics best-effort and no-throw; telemetry must never block cart, checkout, product, or newsletter behavior.
- Keep incident transitions, job claims, acknowledgements, and rate limits atomic/idempotent under retries and overlap.
- Bound external requests, response parsing, persisted errors, queue reads, and dashboard history.
- Add focused regression tests before fixing defects, then run the complete relevant matrix.

## Git and coordination

- The containing repository is `Shop & Sons`; active development is on `dev`, and only Beckett approves `dev` to `main` because `main` publishes the storefront.
- Reread `STATE.md` and Git status at session start and handoff. One session owns `STATE.md` at a time.
- Never let two sessions edit this checkout concurrently. Use separate branches/worktrees and record any split in `STATE.md`.
- Do not flatten or create another repository without approval.

## Verification and handoff

Before declaring a phase complete:

1. Run Operations tests, both TypeScript checks, Wrangler dry run, and all migrations against a clean local D1 database.
2. Run relay tests, Python compilation, plist validation, and Operations audit.
3. For storefront changes, run analytics tests, Astro check, static build, configured collector build assertion, and storefront audit.
4. Run `git diff --check`, review status/diff, and perform a credential-pattern scan that distinguishes explicit test fixtures from real secrets.
5. Update `STATE.md` with exact results, blockers, dirty paths, and the next approval gate.
6. Do not substitute a chat summary for the durable handoff.
