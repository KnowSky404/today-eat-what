# Contributor and coding-agent contract

This file applies to the entire repository.

## Purpose and boundaries
- A local-first, privacy-respecting meal-choice roulette. The first release has no account, backend, advertisements, analytics, geolocation, or remote restaurant API.
- Keep the Web experience excellent at 320–1920+ CSS pixels. Do not treat desktop as a stretched mobile screenshot.
- Preserve WeChat Mini Program compatibility. Use Taro APIs and @tarojs/components in shared UI, not direct window/document/localStorage access.
- Build static H5 for GitHub Pages project path and Cloudflare Workers root path. Never hardcode asset URLs or deployment credentials.
- Respect the existing AGPL-3.0 license.

## Architecture
- src/domain/: pure menu types, selection, validation and sample data. No framework imports.
- src/services/: storage via Taro, with guarded parsing and schema versioning.
- src/pages/: presentation and interaction using React + Taro components.
- Keep selection uniform over *enabled shop+dish pairs*, not first choosing a shop uniformly.
- Avoid I/O in domain logic; keep business rules independently testable.
- Avoid unnecessary libraries, global state solutions and microservices.

## Product and design
- Chinese-first, Apple-inspired restraint: generous spacing, typography, calm surfaces, subtle motion and honest feedback. Do not copy Apple marks, proprietary assets, or interface screenshots.
- Respect reduced-motion preferences and small touch targets; use accessible button names and textual result independent of wheel color.
- Support empty states, local persistence failure, long dish names and a changing number of entries.
- Keep example entries clearly labeled as editable demo data.

## Engineering workflow
- Adopted from [Manifest at 6f387de5065b6ffc475908880362939185ff89d7](https://github.com/KnowSky404/Manifest/blob/6f387de5065b6ffc475908880362939185ff89d7/docs/AI_NATIVE_DEVELOPMENT_WORKFLOW.md). Use the local [workflow and verification guide](docs/development-workflow.md).
- Before editing, record objective, scope, acceptance, risk, authorization, base SHA and task branch in the PR or ignored `.task/`. Use a short-lived branch, focused commits and a PR. Do not merge automatically. At milestones record head, evidence, findings and next action. After a handoff or compaction reconcile that record with Git and checks.
- Classify by highest impact: R0 ordinary docs; R1 isolated presentation; R2 features or shared state; R3 storage migration, privacy, credentials, dependencies with security impact, or changes to critical CI/release controls. Raise uncertain risk. Run local diff inspection and affected checks, and include tests for domain behavior. Keep secrets out of Git, logs, test fixtures and PRs.
- Require CI's `Required checks` on the integration revision. Only the explicit ordinary-docs allowlist can skip app checks. Other diffs run unit/type, root/Pages H5, real Chromium and Firefox, and compiled WeChat checks. CI control changes must pass both the old applicable local gates and the new gate. Reuse evidence only for equivalent inputs and rerun affected checks when they change.
- Review the change and affected context for correctness, security and regressions. R0 needs no full review cycle. R1/R2 require remote review, with two/three feedback cycles respectively. R3 requires independent review (or Owner-approved equivalent), remote code and security review, and candidate and rollback evidence, with three cycles before Owner arbitration. Batch feedback, record dispositions, and reverify the changed paths and final head/base. Block P0/P1 and material P2 findings that affect acceptance or safety. At the cycle limit, take unresolved blockers to the Owner.
- Mark ready to merge only after valid checks, required reviews, candidate acceptance and rollback evidence. Report implementation, merge, release, deployment and production verification separately. Push, merge, previews, production release and destructive operations follow their existing authorization boundaries. Treat a public URL as a deployment target until the corresponding platform deployment is verified.

## Runtime regression
- Pages subpath tests must use a real browser, not just a successful Vite build. Run `bun run build:pages` then `bun run smoke:h5` (Playwright Chromium and Firefox installed).
- Do not set `h5.router.basename: '/'`; in Taro 4.3.1 it causes an empty `#app` after the hash redirect. Preserve the default basename and test `/today-eat-what/` serving.

## Visual layout acceptance
- DOM smoke tests are not visual tests. Check responsive geometry at 320, 390, 768, 1024, 1440, 1680 and 1920px in Chromium and Firefox.
- Taro Button default styles can make action buttons expand in flex/grid layouts. Explicitly constrain individual button widths and prevent menu dish names from collapsing to vertical glyphs.
- Preserve screenshot artifacts (desktop/tablet/mobile) from CI for human review before merging a UI change.

## Cloudflare Workers Builds ownership
- Cloudflare Workers is deployed by Cloudflare Workers Builds through a connected GitHub repository, not by GitHub Actions.
- Keep `wrangler.jsonc` as the source of truth for Worker name, static assets directory and SPA fallback.
- The Worker name is `today-eat-what`; it must match the Cloudflare dashboard Worker name.
- Build H5 for Workers at `/` using `bun run build:workers`; only GitHub Pages uses `/today-eat-what/`.
- Deploy Worker static assets with `bun run deploy:workers`; previews use `bun run preview:workers` (opt-in).
- Do not reintroduce a second GitHub Actions deploy of the same Cloudflare Worker.

## Winner flow and curated seed data
- A spin is complete only when the pointer has stopped and a visible winner dialog appears. The dialog must show the actual selected dish, shop, district and any saved personal note.
- Mobile 375×667 and 390×844 viewports must reveal both roulette and primary spin button without scrolling.
- Default seed entries are maintainer-supplied recommendations. Preserve uncertainty in notes and do not fabricate restaurant dishes, addresses, ratings or prices.
- Migrate only the exact untouched original demo seed; never overwrite customized or intentionally empty menus. Keep the same local storage key/version where feasible.
- Keep celebration animations CSS-only and honor reduced-motion preferences. Keep shared components compatible with WeChat Mini Program.
