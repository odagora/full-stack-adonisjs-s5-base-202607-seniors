# CI Workflows — Implementation Notes

Engineering log for `.github/workflows/deploy-docs.yml` and
`.github/workflows/docs-quality.yml`: every bug found, the decisions behind
each fix, what was manually tested, and known strengths/weaknesses of the
current setup. Written for whoever (human or agent) touches these workflows
next, so they don't have to re-derive any of this from scratch.

Related reusable prompts (Spanish, user-facing, describe desired outcomes
rather than implementation): `docs/PROMPT-starlight-docs.md`,
`docs/PROMPT-deploy-docs.md`, `docs/PROMPT-docs-quality.md`.

## Repo context relevant to both workflows

- Monorepo: the docs site lives in `docs/site/` (its own `package.json` /
  lockfile), not at the repo root. The backend lives in `backend/`.
- Two git remotes: `origin` (the maintainer's personal fork,
  `odagora/full-stack-adonisjs-s5-base-202607-seniors` — the actual deploy
  target) and `upstream` (`LIDR-academy/...`, the course org repo). Never
  assume which one is the deploy target — confirm explicitly.
- ADR sources live in three places: `docs/adr/`, `backend/docs/adr/`,
  `frontend/docs/adr/` (log4brains, one folder per monorepo package).
  `scripts/sync-adrs.sh` copies real ADRs (excluding log4brains's own
  `index.md`/`README.md`/`template.md` scaffold files) into
  `docs/site/src/content/docs/adr/`, injecting the `title` frontmatter
  Starlight requires and stripping the leading `# Title` line so it isn't
  duplicated on top of Starlight's own frontmatter-driven heading.
- The OpenAPI spec (`docs/site/openapi.yaml`) is a **manually generated
  snapshot** of the real backend contract, produced by
  `scripts/generate-openapi.sh` (curls the live backend's `/api.yaml`). It is
  committed to git — the docs build never talks to a live backend.

---

## Workflow 1 — `deploy-docs.yml`

Builds the Astro/Starlight site and publishes it to GitHub Pages on every
push to `main` that touches `docs/site/**`.

### Bugs found and fixed

| Bug | Root cause | Fix |
|---|---|---|
| Deploy job failed on permissions | `deploy-pages`/`upload-pages-artifact` need `contents: read`, `pages: write`, `id-token: write` plus a declared `environment: github-pages` — none of which a plain `on: push` workflow has by default | Added explicit `permissions` block and `environment` on the deploy job |
| `npm ci` failed / wrong lockfile | Monorepo — Astro's `package.json`/lockfile is in `docs/site/`, not repo root | `working-directory: docs/site` on every step, `cache-dependency-path: docs/site/package-lock.json` on `setup-node` |
| Site deployed with broken assets/links | `base`/`site` in `astro.config.mjs` were copied from an unrelated reference project (`/flowsync`) instead of matching this repo's real GitHub Pages URL | Set `site: 'https://odagora.github.io'`, `base: '/full-stack-adonisjs-s5-base-202607-seniors'` — verified by inspecting generated `href`/sitemap output locally before deploying |
| Deploy succeeded but site still broken in production | Two hardcoded absolute links in `docs/site/src/content/docs/index.mdx` (`/flowsync/adr/...`, `/flowsync/api/`) — leftover from an earlier, different `base` value, never updated when `base` changed | Rewrote both links to be **relative** (`adr/.../`, `api/`) instead of absolute-with-hardcoded-base. Relative links are resolved correctly by Astro/the browser regardless of what `base` is configured to, so this class of bug can't recur here |
| GitHub Pages deploy job failed even with correct YAML | GitHub Pages must be manually switched to "Build and deployment → Source: GitHub Actions" in repo Settings — no workflow can do this from the outside | Manual one-time step, documented; not something to attempt to automate |

### Decisions

- Deploy target is `origin` (the fork), confirmed explicitly rather than assumed, because two remotes exist.
- `base`/`site` are hardcoded to the current GitHub Pages URL rather than computed dynamically — acceptable since the deploy target is fixed and known; would need revisiting if the repo is ever renamed or moved to a custom domain.
- Node version pinned to 24 to match the rest of the repo (backend/frontend `.nvmrc`), not the "Node 22" from the original naive reference prompt — 22 would have worked (Astro only requires `>=22.12.0`), but 24 avoids an unnecessary inconsistency.

### Manual verification performed

- Ran `astro build` locally with the final `site`/`base` values and inspected the generated HTML/`sitemap-index.xml` to confirm every internal link and asset path carried the correct base prefix, before ever pushing.
- After the real deploy succeeded, used a live browser (via `playwright-cli`) to actually visit `https://odagora.github.io/full-stack-adonisjs-s5-base-202607-seniors/` — not just trusted a green Actions run — and this is exactly what caught the two hardcoded `/flowsync/...` links; the build itself had reported zero errors.

### Known weaknesses

- `gh` CLI has an invalid/expired token in this environment for the whole duration of this work — every PR creation and merge had to be done manually by the repo owner via the browser; an agent could not automate this step.
- `deploy-docs.yml` itself is structurally not coverable by branch-protection required-status-checks: it only triggers on `push` to `main` (never on `pull_request`), so GitHub never offers it as a selectable required check — the deploy always runs *after* a merge, not before it. This isn't a gap to fix; the real pre-merge gate is `docs-quality.yml`'s checks (see below), which now block bad content from reaching `main` in the first place.

---

## Workflow 2 — `docs-quality.yml`

Runs on `pull_request` (scoped to doc-relevant paths) plus a weekly
`schedule` (Mondays 06:00 UTC, links-only) and `workflow_dispatch`. Four
independent jobs, none of which generate or commit anything — they only
fail loudly when something is stale or broken, so a human has to run the
fix and commit it.

### Job: `markdownlint`

Runs `markdownlint-cli2` (via `DavidAnson/markdownlint-cli2-action@v19`)
against the real ADR sources (`docs/adr/**/*.md`, `backend/docs/adr/**/*.md`,
`frontend/docs/adr/**/*.md`) plus root `*.md` (which also expands to
`docs/**/*.md`, covering the PRD, the `PROMPT-*.md` family, and this file).
Config lives in `.markdownlint-cli2.jsonc` at the repo root. Like
`adr-sync`/`openapi-freshness`, does not run on `schedule` — nothing new to
lint without a PR.

**Decision — relax rules against real content instead of enabling defaults
blindly.** This is the exact gap flagged in `docs/PROMPT-docs-quality.md`
(point 4) and in the "Known weaknesses" note below (now resolved): running
`markdownlint-cli2` with zero config against this repo's actual content
produced 124+ findings, the overwhelming majority of which were noise, not
real formatting problems. Went rule-by-rule instead of accepting defaults:

- **`MD013` (line-length) — disabled.** This repo doesn't hard-wrap prose.
  ADRs, the PRD, and this very file routinely have single lines 100-500
  characters long (long inline explanations, URLs, MADR "Pros and Cons"
  bullets, a 484-char line in `docs/PRD.md`). Raising the limit wouldn't
  help — outliers are an order of magnitude over any reasonable cap — and
  hard-wrapping would hurt readability/diffability more than a line-length
  rule would help. Disabled outright rather than tuned to a number.
- **`MD024` (no-duplicate-heading) — relaxed to `siblings_only: true`.**
  This file legitimately repeats an `### Known weaknesses` subheading under
  two unrelated parent sections (Workflow 1 and Workflow 2). Restricting the
  check to sibling headings (same parent) keeps it useful for catching
  actual accidental duplicates within one section without flagging this
  intentional repeated substructure.
- **`MD060` (table-column-style) — disabled permanently.**
  Every pipe-table in this repo (`README.md`, `CLAUDE.md`, this file) uses a
  compact separator row (`|---|---|`) with padded/spaced header and data
  rows — a style mismatch by MD060's definition, but consistent and
  pre-existing repo-wide, not something specific to the ADRs touched in this
  round. Flagged to the user rather than guessed; decided to keep it
  disabled — reformatting every existing table repo-wide would be a
  cosmetic-only change with no real benefit over the current, already
  consistent style.
- **`MD022`/`MD032` (blanks around headings/lists) and `MD012`
  (no-multiple-blanks) — kept at default, real content fixed instead.**
  Unlike the three above, these were genuine, trivial, mechanical formatting
  slips (a missing blank line before a heading/list in `CLAUDE.md`,
  `docs/PRD.md`, `docs/NOTAS-FORMADOR.md`; two trailing blank lines instead
  of one in `README.md`) — not a rule/content mismatch. Fixed the four files
  directly (whitespace-only, no semantic change) rather than relaxing rules
  that reflect a real, if minor, formatting bug.
- **`MD040` (fenced-code-language) — kept at default, real content fixed.**
  Three `PROMPT-*.md` files and `README.md` had fenced blocks with prompt
  text or a plain directory tree and no language tag. Tagged them
  ` ```text ` (they're not code in a specific language) rather than
  disabling the rule.
- **Ignored paths** (`.markdownlint-cli2.jsonc`): `**/node_modules/**`
  (defensive, same gotcha already hit by the lychee jobs — `docs/site/` is
  its own npm package); `docs/site/**` (its own `AGENTS.md`/`CLAUDE.md`/
  `README.md` aren't authored content for this check, and
  `docs/site/src/content/docs/adr/**` is the `sync-adrs.sh`-generated *copy*
  of the real ADR sources, already linted directly — linting the copy too
  would just double-report the same findings); the three log4brains
  scaffold files (`docs/adr/index.md`/`README.md`/`template.md`), same
  exclusion `sync-adrs.sh` and the lychee jobs already apply and for the
  same reason (not ours to maintain).
- **Not activated as unconditionally blocking beyond what's verified**: the
  job does fail the PR (`fail`/non-zero exit is the action's default
  behavior, same as any other job here) — but only on the rules confirmed
  real above, per the explicit request to confirm before enabling anything
  that might fail on noise. `MD060` was the one rule left genuinely
  undecided at first; now resolved (see above) and disabled by decision,
  not by default.

**Manual verification performed** (same "both directions" standard as every
other job in this file):

- Ran `markdownlint-cli2` locally against the exact globs used in the
  workflow job, with the final config — `0 issues in 0 files` (`13 files`
  linted, matching the ADRs + root/docs `*.md` set).
- Appended an unlabeled ` ``` ` fenced code block (a real `MD040` violation)
  to a scratch copy of `docs/PROMPT-docs-quality.md`, reran the same
  command, and confirmed it reported the exact injected error
  (`MD040/fenced-code-language`) with a non-zero exit code — then restored
  the file from a pre-edit backup and reran to confirm `0 issues` again.

### Job: `adr-sync`

Re-runs `scripts/sync-adrs.sh` and fails if the result differs from what's
committed under `docs/site/src/content/docs/adr/`.

- **Bug fixed**: initial drift check used `git diff --exit-code`, which
  only detects changes to *tracked* files — a brand-new ADR that was never
  synced would produce an untracked file, invisible to `git diff`. Switched
  to `git status --porcelain`, which catches modified **and** new/untracked
  files.
- **Design note**: intentionally does *not* run on `schedule` — there's
  nothing new to compare against without a PR diff.

### Job: `openapi-freshness`

Boots the real backend (bootstraps `.env`, generates `APP_KEY`, runs
migrations, starts `node ace serve`), waits for it to respond, runs
`scripts/generate-openapi.sh` against it, and fails if the regenerated
`docs/site/openapi.yaml` differs from what's committed.

- **Bug fixed — missing `tmp/` directory**: `backend/tmp/` (where the
  sqlite file lives) is gitignored, so it doesn't exist on a fresh CI
  checkout. `better-sqlite3` throws `TypeError: Cannot open database
  because the directory does not exist` before migrations can even run.
  Never noticed locally because a stale `tmp/` from earlier dev sessions
  was always present. **Fix**: `mkdir -p tmp` before `npm run
  migration:run`.
- **Bug found — `@foadonis/openapi` duplicate-parameter accumulation**:
  every HTTP request to `/api.yaml` or `/api.json` mutates persistent,
  in-memory route/parameter registration state inside the running backend
  process, appending a duplicate `id` path parameter to the
  `GET /api/v1/users/:id` operation **on every single request**, forever,
  until the process restarts. This silently corrupted the committed
  `openapi.yaml` snapshot over the course of many manual test runs across
  this whole project (it had accumulated 3 duplicate entries by the time
  this was caught). Confirmed by curling `/api.yaml` three times in a row
  against one live backend boot and watching the duplicate count grow each
  time (5 → 6 → 7 → 8 occurrences of `name: id`).
  - `scripts/generate-openapi.sh` itself was contributing to this — it did
    a health-check request *and* a content-fetch request, both against
    `/api.yaml`, doubling the pollution per invocation.
  - **Fix**: the health-check probe (in both the script and the workflow's
    wait-loop) now hits `/api/v1/health` instead of `/api.yaml`, so each
    invocation makes exactly one request to the polluting endpoint.
  - **Residual, not fixed**: a smaller, *static* (non-accumulating)
    duplication remains — a fresh single boot still produces two `id`
    parameter entries for that one operation, because `@foadonis/openapi`
    auto-infers a path parameter from the AdonisJS route pattern (`:id`)
    *in addition to* the explicit `@ApiParam({ name: 'id', ... })` decorator
    already present in `UsersController`. Cosmetic; not blocking. Could be
    cleaned up later by removing the redundant manual decorator.
  - This is a real upstream defect in `@foadonis/openapi`, not something in
    this repo's control beyond working around it. Worth reporting upstream
    or revisiting if the package updates.

### Jobs: `check-links-source` + `check-links-built` (two-layer link checking)

Two separate `lychee` jobs, deliberately covering different things:

- **`check-links-source`** scans raw markdown/MDX source, restricted to
  `--scheme https --scheme http` — external links only. Internal
  Astro/Starlight routing links in raw source don't have the site's `base`
  applied yet, so there's no way to judge whether they're correct before a
  build happens.
- **`check-links-built`** actually builds the site, serves it with `astro
  preview` (which applies `base` exactly like production), and checks
  links in the real rendered HTML against that live server via
  `--base-url`. This is the job that would have caught the original
  hardcoded-`/flowsync/`-link bug (see Workflow 1) had it existed at the
  time.

**Bugs found and fixed, `check-links-built`:**

- `--base-url` was missing the Astro base path suffix (`http://localhost:4321`
  instead of `http://localhost:4321/full-stack-adonisjs-s5-base-202607-seniors/`).
  Every fragment-only same-page anchor link (`#_top`, `#authentication`, etc.
  — Scalar's internal API-reference navigation) resolved against the bare
  server root, which serves nothing (everything lives under the base path),
  producing 15 false-positive 404s. **Fix**: include the full base path in
  `--base-url`. Verified by installing `lychee` locally and reproducing the
  exact failure before and after the fix.
- `docs/site/dist/404.html`'s own canonical `<link>` self-referentially
  points at `/404/`, which by design isn't a real route and always 404s.
  False positive. **Fix**: `--exclude-path 'docs/site/dist/404.html'`.

**Bugs found and fixed, `check-links-source`:**

- Log4brains scaffold files (`docs/adr/index.md`, `README.md`,
  `template.md`) contain a root-relative image link only meaningful inside
  log4brains's own served site (`/l4b-static/...`) and a literal unresolved
  placeholder URL (`http://insert-your-log4brains-url/`). **Fix**:
  `--exclude-path` for those three files, mirroring the exclusion list
  `scripts/sync-adrs.sh` already uses for the same reason.
- The glob `docs/**/*.md` recurses into `docs/site/node_modules/` — 494 of
  512 matched files were third-party npm package READMEs, none relevant.
  This never affects the real CI run (that job never runs `npm ci`, so
  `node_modules` doesn't exist there) but made local reproduction look
  like `lychee` was hanging (it was actually checking hundreds of
  irrelevant external links). **Fix**: `--exclude-path 'node_modules'`
  added defensively regardless, so correctness doesn't depend on
  environment ordering.
- `--scheme https --scheme http` did **not**, by itself, prevent `lychee`
  from attempting to resolve schemeless local links (relative or
  root-relative). An unresolvable root-relative link (e.g. `/foo/`) caused
  a **hard job-failing internal error** ("Cannot resolve root-relative
  link ... provide a root dir"), not a graceful skip — meaning any future
  internal absolute link accidentally left in source markdown would break
  this job for a configuration reason, not a real content reason. Root
  cause: without `--root-dir`, `lychee` can't convert a schemeless local
  link into *any* URL (not even `file://`) to apply the `--scheme` filter
  against. **Fix**: added `--root-dir .` — local links now resolve to
  `file://` URIs, which `--scheme` then correctly excludes as intended.

**Real content bugs found (not tooling bugs) — required a decision, not just a fix:**

- A genuinely dead external link, `https://adr.github.io/adr-log/` (404),
  in the log4brains-authored ADR about log4brains itself. **Decision**:
  excluded via `--exclude` rather than editing third-party scaffold
  content that isn't ours to maintain.
- Three ADR "Links" cross-reference sections used raw markdown
  relative-file-path syntax (e.g. `20260802-use-sqlite-....md`, or
  `../../../docs/adr/....md`) — correct for browsing the raw `.md` file on
  GitHub, but broken once rendered through Starlight's clean-URL routing
  (which never serves literal `.md` files). **Decision**: rewrote all three
  to Starlight-relative clean-URL paths (`../<slug>/`), explicitly trading
  GitHub-raw-browsing correctness for site-rendering correctness, since the
  site is now the primary way these ADRs are read.
- Even after that fix, `lychee` itself has a **demonstrated, unresolved
  limitation**: when scanning local built HTML with Astro's
  directory-per-page ("pretty URL") output structure
  (`dist/adr/<slug>/index.html` → `/adr/<slug>/`), it miscalculates the
  resolution depth of relative links like `../other-slug/`, stripping one
  extra path segment and producing a false-positive 404 — confirmed with
  `--root-dir` added too (didn't help). Independently verified the actual
  links are correct for a real browser: computed the RFC 3986 relative-URL
  resolution by hand, then confirmed with `curl` that the resulting
  absolute URL returns `200` and matches Starlight's own equivalent
  auto-generated sidebar link. **Decision**: excluded these three specific,
  independently-verified-correct links via `--exclude` (with the reasoning
  documented inline in the workflow YAML), rather than reverting to
  hardcoded absolute paths — which would reintroduce exactly the
  hardcoded-`base` fragility class of bug this job exists to prevent. Any
  *new* ADR cross-reference added in the future using the same relative
  pattern will likely need its own matching exclude line.

### `llms.txt`

Added `llms.txt` in `docs/site/public/`, following the [llmstxt.org](https://llmstxt.org)
standard (H1 project name, a summary blockquote, and H2 sections of `[name](url):
description` links) — a machine-readable entry point for LLMs/crawlers that
points at the published docs site, the GitHub repo, and the README/PRD, plus a
plain-text summary of the stack and backend conventions. Written in English
(the standard's usual convention, since it targets external agents/crawlers)
even though the rest of the repo's docs are in Spanish.

- Vive en `docs/site/public/` (no en la raíz del repo) para que Astro lo
  copie tal cual al build y quede servido en
  `https://odagora.github.io/full-stack-adonisjs-s5-base-202607-seniors/llms.txt`.
  El estándar asume el archivo servido en la raíz del dominio; con un
  *project site* de GitHub Pages lo máximo posible es la raíz del `base`.
- Added `docs/site/public/llms.txt` as an explicit input to
  `check-links-source`'s `lychee` args: it's a `.txt` file, so none of that
  job's existing `*.md`/`**/*.md` globs pick it up, and its links (GitHub
  repo, docs site, README/PRD blob links) are exactly the kind of
  external/absolute links that job already checks for everything else.
- **Decision — no freshness/drift check against `CLAUDE.md`**: considered
  adding a CI job to detect when `llms.txt`'s stack/conventions summary goes
  stale relative to `CLAUDE.md`, mirroring `adr-sync`/`openapi-freshness`.
  Rejected as over-engineering for now — `llms.txt` is prose describing
  slow-moving facts (stack choice, backend conventions), not a generated
  artifact with a canonical source to diff against byte-for-byte. Treated as
  an accepted, documented risk: if the stack or conventions change,
  `llms.txt` needs a manual update, same as the README. Revisit only if this
  file starts drifting in practice.

### Schedule (cron)

Added a weekly cron (`0 6 * * 1`, Mondays 06:00 UTC), scoped only to the
two link-checking jobs via `if: github.event_name != 'schedule'` on
`adr-sync` and `openapi-freshness` — content-drift checks only make sense
against a specific PR diff, whereas link rot (an external site going down)
can happen independently of any change to this repo. Not yet observed
actually firing (can't be triggered on demand — `workflow_dispatch` is a
different event type from `schedule`); the conditional is a simple string
comparison, treated as low-risk without a live-fire test.

### Manual end-to-end verification ("does it fail when it should, not just pass")

The most valuable testing done on this workflow wasn't "does it run
without error" — it was verifying each job **actually fails on a real
problem, and doesn't fail on things that are actually fine**. Both
directions matter: most of the bugs above (the `--base-url` gap, the
`404.html` false positive, the `node_modules` glob, the `--root-dir` gap)
were only found by running checks against genuinely-correct content, not
by injecting failures.

Concrete test performed on the real PR (not just locally):

1. Four isolated, unrelated changes committed together, one designed to
   break exactly one job:
   - Edited an ADR source file without re-running `sync-adrs.sh` → should
     break `adr-sync`.
   - Added a field to `loginValidator` without re-running
     `generate-openapi.sh` → should break `openapi-freshness`.
   - Added a dead external link to `README.md` → should break
     `check-links-source`.
   - Added a link to a nonexistent internal path in
     `docs/site/src/content/docs/index.mdx` → should break
     `check-links-built`.
2. Pushed, confirmed **exactly** those 4 jobs turned red, for the reason
   stated — no more, no fewer. First attempt actually caught a real bug
   this way: `check-links-source` went red, but for the wrong reason (the
   `--root-dir` gap above), which prompted the fix.
   - Also learned mid-test that `.invalid`/`.example`/`.test` TLDs are
     RFC 2606-reserved and excluded by `lychee` by default (intentional
     documentation placeholders) — the first dead-link test used
     `.invalid` and was silently skipped rather than flagged. Not a
     `lychee` bug; a test-authoring mistake, corrected to a fake `.com`
     domain.
3. Reverted/resolved properly, not with a blind `git revert`: for the two
   drift-detecting jobs, removed the test artifact from the source and
   **re-ran the real generation scripts** (`sync-adrs.sh`,
   `generate-openapi.sh`, the latter against a freshly booted backend)
   to confirm the regenerated output exactly matched the pre-existing
   committed baseline (it did, byte for byte — `git status` showed no
   diff). The two link-test changes were reverted directly.
4. Re-ran all 4 checks locally and confirmed 0 errors across the board
   before pushing the final revert.

### Known weaknesses

- `markdownlint-cli2` is now implemented (see "Job: `markdownlint`" above) —
  no longer deferred. Vale (prose linting) is still **not implemented**,
  explicitly out of scope for this round: almost all of this repo's
  documentation (ADRs, PRD, README) is written in **Spanish**, while
  Vale's common built-in styles (`write-good`, `alex`, `proselint`)
  assume English prose. Enabling Vale as-is would produce noise, not
  signal, and there's no satisfactory style pack for Spanish prose yet.
- **Resolved**: a GitHub ruleset on `main` now requires all 5 `docs-quality.yml`
  jobs (`markdownlint`, `adr-sync`, `openapi-freshness`, `check-links-source`,
  `check-links-built`) to pass before a PR can merge, with bypass disabled
  even for repo admins — a red run now structurally blocks the merge, not
  just relies on someone noticing. This also closes the manual-snapshot
  staleness gap below in practice: `adr-sync`/`openapi-freshness` failing
  now actually prevents the merge, not just reports it.
- `lychee`'s relative-link depth-resolution limitation (see above) is
  worked around per-link, not fixed generally — it will very likely
  recur the next time someone adds a new ADR cross-reference using the
  same pattern, and will need a new matching `--exclude` line rather than
  being caught automatically.

---

## Cross-cutting decisions

- **Manual snapshot + drift-detection, not live-generation in CI.**
  Generated docs content (synced ADRs, the OpenAPI spec) is committed to
  git and regenerated by hand via `scripts/*.sh`, rather than generated
  fresh on every CI build. Trade-off accepted deliberately: keeps the docs
  build fully reproducible and independent of a live backend, at the cost
  of a staleness risk — mitigated (not eliminated) by the two
  drift-detection CI jobs, which fail loudly rather than silently
  tolerating drift.
- **Verify in both directions, always.** Never consider a check "done"
  because it runs without a syntax error. Confirm it (a) actually fails on
  a real injected problem, and (b) passes cleanly against genuinely
  correct current content. The large majority of real bugs documented
  above were only found via (b).
- **Document every workaround inline, in the YAML itself.** Every
  `--exclude`/`--exclude-path` that isn't self-explanatory has a comment
  next to it explaining *why* — so a future maintainer doesn't
  mistake a deliberate, verified workaround for an oversight (or vice
  versa).
- **Prefer the smallest fix that solves the actual problem.** Concretely:
  chose a `sync-adrs.sh` string-strip over adding a whole remark plugin to
  Astro's markdown pipeline to solve a duplicate-title problem, once a
  simpler fix was confirmed to work — removed a dependency rather than
  adding one.
- **`main` is protected by a GitHub ruleset** (configured manually by the
  repo owner in Settings → Rules, not something an agent can do — this
  requires `gh` auth or repo-admin web access). Requires all 5
  `docs-quality.yml` jobs to pass before merging, with bypass disabled for
  everyone including admins. `deploy-docs.yml`'s jobs are intentionally
  not part of this ruleset — they only run on `push` to `main` (post-merge),
  so GitHub never offers them as selectable required checks in the first
  place.
