# Checkpoint 2 — verification report for Sam's review

Run: 2026-11-24, 18:20–18:35 UTC, in a new Emergent workspace. Status: **Checkpoint 2 remains conditionally
approved. Nothing merged, nothing tagged, Checkpoint 3 not started.** Every number below comes from a run made
in this session; raw outputs are in this folder.

GitHub base: `https://github.com/sbnem68/tires`

## Read these first (things that differ from a plain "all clear")

1. **`2c3eeb8` is a documentation-only commit.** Its own diff is one line in `AGENT_PROGRESS.md`. It *contains*
   both fixes as ancestors: analytics removal is `f79a81c`, strict city precedence is `9c0258f`.
2. **The development preview page still loads a recorder that this repository does not contain.** The workspace
   dev server injects `/__emergent_overlay__/recorder.js` (an rrweb-based buffer recorder, `window.rrweb` is
   present) and the preview host injects a Cloudflare beacon (`static.cloudflareinsights.com`, `POST /cdn-cgi/rum`)
   and a `cf_clearance` cookie. None of this is in `index.html`, the source, or the production build. In the
   recorded requests it sent no wizard input (details in section 2). I did not inspect what the recorder holds in
   browser memory. Switching it off in the preview needs a small config change, which I have not made because it
   was not requested.
3. **"Network tab" screenshots are rendered request logs.** The test browser is headless and has no DevTools
   panel. The images are a table of every request the browser recorded; the full lists are in the JSON files.
4. **`backend/seed.py` was changed earlier in Checkpoint 2** (commit `d8daf86`, adds the `--review-cities-only`
   mode). It was not changed by either required fix. No migration file and no Checkpoint 0/1 test file has changed
   since `checkpoint-1-approved`.
5. **This workspace's setup.** To serve the preview I checked out the Checkpoint 2 branch in the workspace
   (previously on `main`), installed PostgreSQL locally, and ran migrations `0001`, `0002` and
   `seed.py --review-cities-only` against that throwaway local database. No repository file changed.
6. **The Foot memo has not been started.**

## 1. Commit and changed-file evidence

| Item | Value |
|---|---|
| Branch | `checkpoint-2-wizard-steps-1-2-continuation` |
| Commit verified | `2c3eeb896c868da8ad30b690b4dab051de1f0804` — [link](https://github.com/sbnem68/tires/commit/2c3eeb896c868da8ad30b690b4dab051de1f0804) |
| Remote branch head when checked (`git ls-remote`) | `2c3eeb8` |
| Branch comparison | [main...checkpoint-2-wizard-steps-1-2-continuation](https://github.com/sbnem68/tires/compare/main...checkpoint-2-wizard-steps-1-2-continuation) |
| Pull request | None that I can confirm; I have not queried GitHub's pull-request list |
| `main` | `5ba000d` locally and on GitHub; the branch is 23 commits ahead and 3 behind; neither fix commit is an ancestor of `main` |
| Tags on GitHub | `checkpoint-0-approved`, `checkpoint-1-approved` only |
| Checkpoint 3 | Not started: no Checkpoint 3 file, route or commit exists |

Commits after the pre-fix state `495b4b5`, oldest first:

| Commit | What it changed |
|---|---|
| [`f79a81c`](https://github.com/sbnem68/tires/commit/f79a81c66baf38cf436cb43081c4bd3dd7c1485a) | **Fix 1.** `frontend/public/index.html` (−74, +2): removed the error-filter script, the `emergent-main.js` script tag and the whole PostHog block; replaced the "you can add analytics" comment with a do-not-add notice. `frontend/src/lib/noAnalytics.test.js` (+25, new guard test) |
| [`9c0258f`](https://github.com/sbnem68/tires/commit/9c0258f5985eb7c8f1926e21e501d09a726d4966) | **Fix 2.** `tireMatchWizard.js` (precedence is now URL city, saved progress, none; the site-wide city argument is removed), `TireMatchPage.jsx` (no longer reads or follows the site-wide city), `CitySelector.jsx` (−3, no longer marks the URL city), `TireMatchPage.test.jsx` (+47/−… tests 3c-strict, 3d, 3e) |
| [`b0060bf`](https://github.com/sbnem68/tires/commit/b0060bf) | `tests/e2e/checkpoint2_browser.py` (+122): browser tests 19, 3c, 3d, 3e |
| [`9cb5e7b`](https://github.com/sbnem68/tires/commit/9cb5e7b) | `.replit` (1 line, written by Replit) |
| [`eaffccb`](https://github.com/sbnem68/tires/commit/eaffccb) | `test_reports/checkpoint2_browser.json`, `tests/e2e/checkpoint2_browser.py` (17 lines), `AGENT_PROGRESS.md` |
| [`7a6e592`](https://github.com/sbnem68/tires/commit/7a6e592) | Docs only: `AGENT_PROGRESS.md`, `CHECKPOINTS.md`, `README.md`, `ROADMAP.md`, `memory/PRD.md`, `plan.md`; new `test_reports/checkpoint2_production_bundle.json` |
| [`2c3eeb8`](https://github.com/sbnem68/tires/commit/2c3eeb8) | `AGENT_PROGRESS.md` (+1) |

Total `495b4b5..2c3eeb8`: 15 files, +758 −196. Nothing under `backend/` changed in this range.

## 2. Analytics removal evidence

**Removed from `frontend/public/index.html` by `f79a81c`** (full diff: `git show f79a81c -- frontend/public/index.html`):

- Head: `<script>window.addEventListener("error", … "PerformanceServerTiming" …)</script>`
- Head: `<script src="https://assets.emergent.sh/scripts/emergent-main.js"></script>`
- Body: the entire PostHog loader and `posthog.init("phc_…", { api_host: "https://ap.emergent.sh", person_profiles: "identified_only", session_recording: { recordCrossOriginIframes: true, capturePerformance: false } })` block (70 lines). Page-view capture, click autocapture and session recording were all functions of this one block; there was no separate code for them.

**After:** the template has no `<script>` tag at all. The built page has exactly one: `/static/js/main.6ba5c62b.js`.
A search of the build output for `posthog`, `ap.emergent.sh`, `emergent-main`, `rrweb` finds nothing.

**No replacement added:** no analytics, tracking, cookie, fingerprinting, recording or event-capture code exists in
the source. Guard test `src/lib/noAnalytics.test.js` passes:
- `the page template loads no analytics, session-recording or platform script` — PASS
- `the application source references no analytics client` — PASS

**Network recordings made in this session** (driver walks the wizard, types a postal code and a repair note):

| | Production build served on its own | Development preview URL |
|---|---|---|
| Viewports | 390x844 and 1440x900 | 390x844 and 1440x900 |
| Requests recorded | 40 per viewport | 70 per viewport |
| PostHog requests | 0 | 0 |
| Requests to `ap.emergent.sh` / `assets.emergent.sh` | 0 | 0 |
| Session-recording requests | 0 | See below |
| Requests containing typed wizard input | 0 | 0 |
| Third-party hosts | `fonts.googleapis.com`, `fonts.gstatic.com` | the same, plus `static.cloudflareinsights.com` |
| Non-GET requests | 0 | `POST /__emergent_overlay__/report` (11), `POST /cdn-cgi/rum` (4), one Cloudflare challenge POST |
| Cookies | none | `cf_clearance` (Cloudflare) |
| Analytics globals on `window` | none | none; but `rrweb`, `__EMERGENT_OVERLAY__` present |

Development preview detail: each `/__emergent_overlay__/report` body was 89 bytes of the form
`{"page":"…","seq":…,"url":"/tire-match","splash":false,"errors":[]}` and goes to the workspace's own dev server.
`/cdn-cgi/rum` is Cloudflare page-timing data that includes the page address. Browser test 19 passes on the preview
because it lists these as "injected by preview host / dev server" rather than failing on them.

Files: `production_bundle/network-production-bundle.json`, `dev_preview/network-dev-preview.json`,
`*/network-log-*-390x844.jpg`, `*/network-log-*-1440x900.jpg`.

**Google Fonts (known third-party asset request).** The page loads Inter, Space Grotesk and IBM Plex Mono from
`fonts.googleapis.com` (stylesheet) and `fonts.gstatic.com` (font files): 20 GET requests in the walk-through, no
request body, no cookie, no script, no wizard input. As with any web request, Google receives the visitor's IP
address and browser user-agent; I did not capture request headers, so I have not measured the referrer value.
Self-hosting the fonts would remove the request and is recorded as an open option.

Other remnants, text only: the template's meta description still reads "A product of emergent.sh"; two
development-only packages in `package.json` are downloaded from `assets.emergent.sh` at install time.

## 3. Strict city precedence evidence

Unit = `frontend/src/pages/TireMatchPage.test.jsx`. Browser = `tests/e2e/checkpoint2_browser.py`, run at both
viewports against the preview URL and against the production build. Every test listed passed in every run.
Fix commit: [`9c0258f`](https://github.com/sbnem68/tires/commit/9c0258f5985eb7c8f1926e21e501d09a726d4966); browser tests: [`b0060bf`](https://github.com/sbnem68/tires/commit/b0060bf).
Screenshots are in `dev_preview/` (also `production_bundle/`), each at `-390x844` and `-1440x900`.

| # | Case | Tests (all PASS) | Screenshot / observed |
|---|---|---|---|
| 1 | URL city preselects | Unit `3. City is preselected from the URL`; Browser `3. City is preselected from URL` | `2-url-city-preselected` — city = ottawa |
| 2 | Manual change after URL preselect survives refresh | Unit `3d. Manual city change after a URL preselect is kept, and survives a refresh`; Browser `3e`, `13` | `3-manual-change-after-url`, `4-refresh-keeps-manual-change` — hamilton before and after reload with `?city=ottawa` still in the address |
| 3 | URL city applied once per browser session | Unit `3d`; Browser `3e` (two refreshes), `13` | Same two screenshots. There is no test named only for this rule; it is proven through the refresh behaviour |
| 4 | URL city replacing a different saved city returns to Step 1 | Unit `3b. A valid URL city wins over saved progress, and original attribution is unchanged`; Browser `3b` | `5a-saved-hamilton-on-step-2` then `5b-url-city-replaces-saved-returns-to-step-1` — Step 1 of 6, city = toronto |
| 5 | Other answers preserved when the city changes | Browser `3b` (postal code and need kept) | `5b` — postal code K1A 0B1 and 25 km still filled in |
| 6 | Original attribution locked 30 days | Unit `18`, `attribution.test.js` (3 tests); Browser `17`, `18`, `A1`, `A2`, `A3` | Stored record compared before/after in the tests |
| 7 | No URL, no saved progress → unselected | Unit `3c-strict. No URL city and no saved progress leaves the city unselected, whatever was chosen elsewhere`; Browser `3c`, `1` | `1-no-url-no-saved` — "Choose a city" |
| 8 | No URL, saved progress → saved city | Unit `3c. No URL city: saved wizard progress restores the saved city`; Browser `3d` | Browser 3d: Hamilton restored after visiting `/toronto` |
| 9 | Dropdown and Continue with no city | Browser `1`, `3c` (Continue disabled), `4` (enabled once a city is chosen) | `1-no-url-no-saved` — Continue disabled = true |
| 10 | No site-wide last-selected city | Unit `3c-strict`, `3e. The city chosen elsewhere on the site never overrides the URL city or saved progress`; Browser `3c`, `3d`, `A3` | Code: `selectedCitySlug` removed from `createInitialWizardState` and `resolveInitialCity` in `9c0258f` |

## 4. Test results (this session)

| Suite | Command | Result | Raw output |
|---|---|---|---|
| Frontend unit | `cd frontend && CI=true yarn test --watchAll=false --runInBand --verbose` | **29 passed, 0 failed** (3 suites) | `frontend_unit.txt` |
| Backend | `cd backend && python -m pytest tests -n 0 -v` | **30 passed, 13 failed** | `backend_pytest.txt` |
| Browser, preview URL | `T4T_BASE_URL=<preview> python3 tests/e2e/checkpoint2_browser.py` | **54 passed, 0 failed** (27 per viewport) | `browser_preview.txt`, `.json` |
| Browser, production build | `T4T_BASE_URL=http://127.0.0.1:4173 python3 tests/e2e/checkpoint2_browser.py` | **54 passed, 0 failed** | `browser_production_bundle.txt`, `.json` |
| Production build | `cd frontend && yarn build` | **Compiled successfully** (200.55 kB JS, 11.45 kB CSS gzipped) | `frontend_build.txt` |

Totals: 167 passed, 13 failed. A first preview browser run was cut off by my own command time limit after 53
results, all passing (`browser_preview_run1_interrupted.txt`); the rerun completed 54 of 54.

**The 13 failing backend tests.** Checkpoint 2's own backend tests pass 7 of 7. All 13 failures are Checkpoint 0/1
tests that assert the full 28-city directory, read from the failure messages of this run:

| Test | Failure in this run | Cause |
|---|---|---|
| `test_checkpoint0::test_01_seed_has_exactly_14_groups_and_28_cities` | `3 == 14` | 3 market groups seeded |
| `test_checkpoint0::test_02_toronto_has_exactly_the_three_supplied_subareas` | `[] == ['Etobicoke', …]` | subareas not seeded |
| `test_checkpoint0::test_03_planning_counts_total_348_without_duplication` | `0 == 348` | planning counts are zero placeholders |
| `test_checkpoint0::test_04_rerunning_seed_creates_no_duplicates` | totals 14/28/3/348 vs 3/3/0/0 | compares full seed with the preview's contents |
| `test_checkpoint0::test_09_market_group_grants_no_service_relationship` | `NoResultFound` | looks up a city that is not seeded |
| `test_checkpoint0::test_10_gatineau_uses_quebec_configuration` | `NoResultFound` | Gatineau not seeded |
| `test_checkpoint0::test_11_gatineau_and_kingston_pools_are_below_the_five_shop_gate` | wrong group list | Gatineau and Kingston groups not seeded |
| `test_checkpoint0::test_14_new_city_is_configured_with_data_only` | `4 == 29` | counts 28 cities plus one |
| `test_checkpoint0::test_architecture_endpoint_is_hidden_in_production` | counts 3/3/0/0 vs 14/28/3/348 | the test stops at its directory-count comparison, so its hidden-in-production assertions do not run on this seed (corrected 2026-11-24; see closeout report section 7) |
| `test_checkpoint1::test_toronto_subareas_are_not_cities` | `[] == ['Etobicoke', …]` | subareas not seeded |
| `test_checkpoint1::test_no_city_is_live_and_ottawa_is_onboarding` | `2 == 27` | expects 27 planned cities |
| `test_checkpoint1::test_tax_components_are_unverified_placeholders` | empty `tax_components` | restricted seed creates the Ontario parent row with no tax placeholders |
| `test_checkpoint1::test_gatineau_is_french_first_and_unpublished` | `NoResultFound` | Gatineau not seeded |

The same 13 as before. No seed or test was modified in this session, and none was modified by the two fixes.
The database held 3 market groups, 3 cities, 0 leads, 0 quotes and 0 shops after the run.

## 5. Preview and screenshots

Preview: https://wizard-cp2-review--8ktg0g80.preview.emergentagent.com/tire-match (this workspace; it stops when
the workspace sleeps, and its local database must be recreated after a workspace restart).

Screenshots, each at `-390x844.jpg` and `-1440x900.jpg`, in `dev_preview/` and `production_bundle/`:
`1-no-url-no-saved`, `2-url-city-preselected`, `3-manual-change-after-url`, `4-refresh-keeps-manual-change`,
`5a-saved-hamilton-on-step-2`, `5b-url-city-replaces-saved-returns-to-step-1`, and `network-log-<target>`.

## 6. Privacy and data confirmations

| # | Item | Status |
|---|---|---|
| 1 | No customer contact information collected | Confirmed — unit and browser test 14; fields are city, postal code, radius, repair note |
| 2 | No lead created | Confirmed — test 15; leads = 0, quotes = 0 before and after |
| 3 | No server write | Confirmed for the application — test 16; only `GET /api/public/config` and `GET /api/public/locations`; backend write attempts return 404/405. The preview's injected tooling does POST (section 2) |
| 4 | No migration or seed change | Confirmed for both fixes and this session. Earlier in Checkpoint 2, `seed.py` gained the restricted mode (`d8daf86`). Migrations unchanged |
| 5 | No personal data to a third party | Confirmed for wizard input: 0 of all recorded requests contain it. IP address and user-agent reach Google Fonts, and on the preview Cloudflare |
| 6 | No analytics or session-recording script remains | Confirmed for the repository and the production build. **Not true of the development preview page**, where the platform injects a recorder and a Cloudflare beacon |
| 7 | Original attribution locked 30 days | Confirmed — tests 17, 18, A1, A2, A3 and three unit tests |
| 8 | Preview database not production-ready | Confirmed — local, three cities, zero placeholder counts |
| 9 | No deployment or public launch | Confirmed — none performed; pages are `noindex` |
| 10 | Nothing merged into `main` | Confirmed — `main` is `5ba000d` on GitHub |

## 7. Foot reference status

**Not started.** No Foot memo exists on any branch. The only Foot-related file is
`FOOT_TIRES_SYNERGY_HANDOFF.md` on branch `docs/next-agent-handoff-foot-tires-synergy` (`f0c8285`), which is
instructions for writing the memo and itself says the assessment was never committed. I have not opened the Foot
repository. That handoff also names `f79a81c` as the last verified commit; the branch has since moved to `2c3eeb8`.

## 8. Approval boundary

Held: no merge to `main`, no `checkpoint-2-approved` tag, no Checkpoint 3 work.

Decisions for Sam:
1. Approve Checkpoint 2, or request further fixes.
2. Whether the development preview's injected recorder and Cloudflare beacon are acceptable for review previews,
   or should be switched off where the repository can control it (the recorder; not the Cloudflare beacon).
3. Whether to self-host the fonts.
4. Foot memo: write it now as documentation only, or defer.
