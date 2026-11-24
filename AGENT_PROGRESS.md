# Agent Progress

Working branch: `checkpoint-2-wizard-steps-1-2-continuation`. Never merge to `main` without Sam's approval.
Do not start Checkpoint 3 until Sam explicitly approves Checkpoint 2.

## Current checkpoint

Checkpoint 2 — Tire Match wizard, Steps 1 and 2 only. Status: CONDITIONALLY APPROVED by Sam (2026-11-24).
Both required fixes are complete, retested and pushed. Awaiting Sam's approval of the updated report.
Not tagged. Not merged to `main`. Checkpoint 3 must NOT start until Sam explicitly approves.

Standing instruction from Sam: push to GitHub the instant each approved change is complete and tested;
never hold finished work locally.

## Backup branches

- `backup/checkpoint2-fixes-verified-20261124-170722` — state after both required Checkpoint 2 fixes (same commit as the working branch).
- `backup/checkpoint2-verified-20261124-163933` — full Checkpoint 2 state at the end of this session (same commit as the working branch).
- `backup/roadmap-20261124-110719` — Sam's roadmap commit.

## Roadmap

`ROADMAP.md` (added by Sam in `406893a`) is the canonical build plan, checkpoint order, approval-gate
record and change log. Read it, `CHECKPOINTS.md`, this file, `README.md` and recent commits before any work.
Sam's roadmap commit changed documentation only and is also saved on `backup/roadmap-20261124-110719`.

## Audit summary (starting point, commit `d8daf86`)

- Wizard Steps 1 and 2, progress indicator, back navigation, local-storage progress, and the
  attribution lock were already built. 21 frontend tests passed (18 numbered + 3 attribution) and
  the production build compiled. This work is kept; it is not being rebuilt.
- Not done at audit time: a database behind the API, a working preview, real-browser evidence,
  screenshots, and this file on the working branch.
- Weak tests found: 12 (checked CSS class names only), 15 (checked local-storage keys only),
  16 (mocked `fetch`, but the app uses axios).

## Decisions from Sam (2026-11-24)

- A. A valid listed city in the URL wins over saved progress; otherwise saved progress; otherwise
  nothing selected. Original attribution and landing city are never overwritten.
- B. Drivers see neutral wording only: "Next: vehicle and tire size (coming soon)." No checkpoint
  or development language in the UI.
- C. Use a local PostgreSQL in the Emergent workspace for the preview only. The Replit development
  database is untouched and unverified. Do not request or use its connection string.
- D. Pushing to the working branch after each completed, in-scope change is authorised. The token
  is supplied through the secure card only; never in a remote URL, file or chat.
- E. Run Checkpoint 0/1 backend tests against the three-city seed; report failures; do not run the
  full 28-city seed; do not change seed scope.
- F. Leave the three extra commits on `main` alone.

## Completed items

- `ROADMAP.md` created as the canonical roadmap, with references added to `README.md` and
  `CHECKPOINTS.md` (Sam, `406893a`).
- Working branch loaded into the Emergent workspace unchanged. Platform environment keys were not edited.
- Local preview database created: PostgreSQL 15, loopback only (`127.0.0.1:5433`), database
  `t4t_preview`. It was empty with no Alembic revision before the run.
- Ran `python -m alembic upgrade head` (applied existing `0001`, then `0002`). No new migration.
- Ran `python seed.py --review-cities-only`. Result: 3 cities (Ottawa onboarding, Toronto planned,
  Hamilton planned; all listed, none indexable), 3 parent market groups with zero planning counts,
  1 province. Zero subareas, prospects, shops, offers, leads, quotes, installs, registrations.
- `GET /api/health` returns 200 with revision `0002`; `GET /api/public/locations` returns 200 with
  the three cities. The earlier HTTP 500 was an unmigrated database.

- REQUIRED FIX 1 done: analytics, session recording and platform script removed from the page template.
- REQUIRED FIX 2 done: strict city precedence (URL city, saved wizard progress, none). This replaces
  the earlier fallback to the city last chosen on the site.
- Seed/test distinction documented in README ("Location seeds and what the tests expect").
- Decision A implemented (first version, since tightened). Precedence was: valid listed URL city, then saved wizard progress, then the
  city the driver last chose on the site, then nothing selected. A URL city is applied once per
  browser session, so a manual change afterwards survives refresh. If the URL city replaces a
  different saved city the wizard returns to Step 1 so the driver sees it; other answers are kept.
  Attribution is never read or written by this logic.
- Decision B implemented. Driver wording is now "Next: vehicle and tire size (coming soon)." and
  similar neutral lines. No checkpoint or development language remains in the UI.
- Tests strengthened: 12 (markup in Jest, real viewport in the browser suite), 15 and 16 (real
  SiteProvider and real axios client with only the transport replaced by a recorder; fetch,
  XMLHttpRequest and sendBeacon are also watched).

- Independent testing-agent verification completed with no application bugs.
- Documentation updated: `ROADMAP.md` (status and three change-log entries), `CHECKPOINTS.md`,
  `README.md`, `plan.md`, `memory/PRD.md`.

## Incomplete items

- None inside Checkpoint 2. Waiting for Sam's approval.

## Known issues

- RESOLVED — analytics. Sam required removal. The PostHog snippet, its recorder error shim and
  `emergent-main.js` are gone from `frontend/public/index.html`. Guard: `noAnalytics.test.js` and
  browser test 19. Do not add any analytics, tracking, cookies or session recording.
- Development preview only (not the application, not in the production bundle): the preview host
  injects its own CDN beacon (`static.cloudflareinsights.com`, `/cdn-cgi`), and the development
  server's overlay (dev dependency `@emergentbase/overlay`, wired in `craco.config.js`) injects an
  error overlay and a same-origin recorder (`/__emergent_overlay__/recorder.js`) and posts a small
  heartbeat (page path and error list). No wizard input appeared in any request. It can be switched
  off in a dev preview with `DISABLE_EMERGENT_OVERLAY=true`; left as is pending Sam's wish.
- Fonts load from Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`): font files only, no
  script or cookie. Self-hosting them would remove the last third-party request. Not changed.
- The template's meta description still reads "A product of emergent.sh". Not changed (out of scope).
- A consequence of strict precedence: if a driver lands with `?city=ottawa`, picks Toronto in the
  header city selector, then opens the wizard, the wizard shows Ottawa (the URL city still carried
  in the query string), because the site-wide choice is never consulted.
- Backend tests against the three-city seed: 25 passed, 13 failed. Every failure asserts the full
  planning directory (14 groups, 28 cities, 3 Toronto subareas, planning total 348, Gatineau/Quebec
  rows). None is a Checkpoint 2 defect. Left unchanged per decision E.
  - `test_checkpoint0.py`: test_01, test_02, test_03, test_04, test_09, test_10, test_11, test_14,
    test_architecture_endpoint_is_hidden_in_production.
  - `test_checkpoint1.py`: test_toronto_subareas_are_not_cities,
    test_no_city_is_live_and_ottawa_is_onboarding, test_tax_components_are_unverified_placeholders,
    test_gatineau_is_french_first_and_unpublished.
- With the three-city seed there are no Toronto subareas, so subarea search in the city selector
  (North York, Scarborough, Etobicoke) finds nothing in this preview.
- `pip install -r backend/requirements.txt` fails in this workspace on a resolver conflict between
  two template packages unrelated to this project. Only the pinned database/API packages were
  installed; `requirements.txt` was not changed.
- The local PostgreSQL server binaries live outside the workspace's persistent folders. The data
  folder persists, but after a workspace restart the server may need reinstalling and restarting.
- `AGENT_PROGRESS.md` on `main` and `AGENT_HANDOFF.md` on `backup/replit-stalled-work` are stale.

## Next immediate task

None until Sam approves the updated Checkpoint 2 report. Checkpoint 3 scope (Wheel-Size widget with
Sam's exact embed, manual tire-size entry) is recorded in `ROADMAP.md`; do not start it.

## Files changed (this session)

- `AGENT_PROGRESS.md` — created, then merged with Sam's version from `406893a`.
- `frontend/src/lib/tireMatchWizard.js` — URL city precedence, session marker, neutral wording.
- `frontend/src/pages/TireMatchPage.jsx` — uses the new precedence; neutral privacy note; `data-outcome`.
- `frontend/src/components/site/CitySelector.jsx` — an explicit city choice outranks a carried `city` parameter.
- `frontend/public/index.html` — PostHog snippet, recorder shim and `emergent-main.js` removed.
- `frontend/src/lib/noAnalytics.test.js` — new guard test.
- `test_reports/checkpoint2_production_bundle.json` — browser results against the production bundle.
- `ROADMAP.md`, `CHECKPOINTS.md`, `README.md`, `plan.md`, `memory/PRD.md` — status and documentation.
- `test_reports/iteration_3.json` — independent testing-agent report.
- `tests/e2e/checkpoint2_browser.py` — new: real-browser suite (mobile and desktop) with network recording.
- `test_reports/checkpoint2_browser.json` — results of the latest browser run.
- `screenshots/checkpoint-2-step-{1,2,2-next}-{mobile,desktop}.jpg` — six screenshots.
- `frontend/src/lib/tireMatchWizard.js` (second change) — an explicit city choice now outranks a URL city already applied in the session (found by browser test A3).
- `backend/tests/test_checkpoint2_no_writes.py` — new: every API route is read-only; no lead or wizard endpoint; write attempts return 404/405 and create no records.
- `frontend/src/pages/TireMatchPage.test.jsx` — tests 3b, 3c, 3d added; 12, 15, 16 strengthened; wording test.

## Commands run

- `git clone`, `git checkout checkpoint-2-wizard-steps-1-2-continuation` (read-only audit)
- `cd frontend && yarn install --frozen-lockfile`
- `cd frontend && CI=true yarn test --watchAll=false --runInBand` → 21 passed
- `cd frontend && yarn build` → compiled
- `apt-get install postgresql` (workspace only), `initdb`, create role and database
- `cd backend && python -m alembic current` → none; `python -m alembic history`
- `cd backend && python -m alembic upgrade head`
- `cd backend && python seed.py --review-cities-only`
- `cd backend && python -m pytest tests -n 0` → 25 passed, 13 failed (see Known issues)

## Test log (newest first; add an entry and push immediately after every test run)

Times marked ~ are approximate (taken before the first commit of this session); the rest match commit times.

| When (UTC) | What was tested | Command | Result |
|---|---|---|---|
| 2026-11-24 17:06 | Full backend suite, three-city seed, after both fixes | `cd backend && python -m pytest tests -n 0` | 30 passed, 13 failed — the same 13 full-directory tests, expected on the preview seed; Checkpoint 2 files 7 of 7 |
| 2026-11-24 17:06 | Production build, then the browser suite against the built bundle served on its own (mobile and desktop) | `cd frontend && yarn build`; `T4T_BASE_URL=http://127.0.0.1:4173 T4T_API_URL=<preview> python3 tests/e2e/checkpoint2_browser.py --only ... --report checkpoint2_production_bundle.json` | PASS — build compiles; 40 of 40; one script tag (the app); no recorder, overlay, PostHog or platform script; only font files fetched from third parties |
| 2026-11-24 17:04 | Real-browser suite after BOTH required fixes (analytics removed; strict city precedence), mobile 390x844 and desktop 1440x900 | `T4T_BASE_URL=<preview> python3 tests/e2e/checkpoint2_browser.py --screenshots screenshots` | PASS — 54 of 54 (27 per viewport). No request to PostHog, `ap.emergent.sh` or `assets.emergent.sh`; no third-party write; no wizard input in any request. An earlier run the same minute had two desktop page-load timeouts (tests 12, 13) that did not recur |
| 2026-11-24 17:04 | Frontend unit suite after both fixes | `cd frontend && CI=true yarn test --watchAll=false --runInBand` | PASS — 29 of 29 (includes template guard test and strict-precedence tests) |
| 2026-11-24 16:39 | Independent verification by the testing agent: backend API, wizard at 390x844 and 1920x800, URL precedence, attribution, network recording, regression of `/`, city pages and city selector | testing agent, report `test_reports/iteration_3.json` | PASS — 49 checks passed, no application bugs. One of the agent's own mobile assertions was wrong (its logic, not the app). No source files changed; database unchanged |
| 2026-11-24 16:26 | Full backend suite, three-city seed | `cd backend && python -m pytest tests -n 0` | 30 passed, 13 failed — the same 13 full-directory tests (see Known issues); all Checkpoint 2 tests pass |
| 2026-11-24 16:26 | Production frontend build | `cd frontend && yarn build` | PASS — compiled successfully |
| 2026-11-24 16:26 | Real-browser acceptance (headless Chromium) at mobile 390x844 and desktop 1440x900: the 18 required tests, 3a/3b precedence, attribution A1-A3 | `T4T_BASE_URL=<preview> python3 tests/e2e/checkpoint2_browser.py --screenshots screenshots` | PASS — 46 of 46 (23 per viewport). Report: `test_reports/checkpoint2_browser.json` |
| 2026-11-24 16:26 | Frontend unit suite after the precedence fix (test 3e) | `cd frontend && CI=true yarn test --watchAll=false --runInBand` | PASS — 26 of 26 |
| 2026-11-24 16:14 | Backend Checkpoint 2 suites: no write/lead endpoint, write attempts rejected, three listed cities, restricted seed | `cd backend && python -m pytest tests/test_checkpoint2_no_writes.py tests/test_checkpoint2_seed.py -n 0` | PASS — 7 of 7 |
| 2026-11-24 16:13 | Frontend unit suite after decisions A and B and stronger tests 12, 15, 16 | `cd frontend && CI=true yarn test --watchAll=false --runInBand` | PASS — 25 of 25 (18 numbered, 3b/3c/3d precedence, wording, 3 attribution) |
| 2026-11-24 ~16:00 | Backend Checkpoint 0/1/2 suites against the three-city seed | `cd backend && python -m pytest tests -n 0` | 25 passed, 13 failed — all 13 assert the full 28-city directory (see Known issues); not changed |
| 2026-11-24 ~15:58 | Local API after migration and seed | `GET /api/health`, `GET /api/public/locations` | PASS — 200, revision `0002`, three cities |
| 2026-11-24 ~15:50 | Frontend unit suite and build at `d8daf86` (audit) | `yarn test`, `yarn build` | PASS — 21 of 21; build compiled |

## Decisions pending user approval

- Approval of the updated Checkpoint 2 report. Until then: no tag, no merge, no Checkpoint 3.
- Optional: switch off the development overlay in dev previews; self-host fonts; fix the template meta description.
- Launch-time: restore the full location seed or split the backend suites (see README).
