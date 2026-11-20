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

## Quality gates
- Run: bun run typecheck, bun run test, bun run build:h5 and bun run build:weapp.
- Include tests for any domain behavior change. Keep secrets out of git.
- Use focused commits and PRs; no direct automatic merge to main.
- All public URLs are deployment *targets* until the corresponding workflow succeeds and platform settings are configured.

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
