# Checkpoint 2 — closeout report for Sam's review

> **Updated 2026-11-24, about 20:30 UTC. Final tested commit: `b721fe4`**
> ([commit](https://github.com/sbnem68/tires/commit/b721fe4)). Sections 6 and 7 below are new and supersede the
> Referer limitation in section 2 and the backend summary in section 1. Sections 1–5 are the earlier closeout at
> `ce3bfb0` and are kept as written. Approval record and its conditions are unchanged; this report is awaiting
> Sam's review.

Tested revision: `ce3bfb0e3e6bc2bdbb9b6bfe5b2339466f1d1b88` on `checkpoint-2-wizard-steps-1-2-continuation`
([commit](https://github.com/sbnem68/tires/commit/ce3bfb0e3e6bc2bdbb9b6bfe5b2339466f1d1b88)).
Run: 2026-11-24, about 19:20–19:40 UTC. Local checkout and GitHub branch head were both `ce3bfb0` when the
runs started. `main` is `5ba000d`. Tags on GitHub: `checkpoint-0-approved`, `checkpoint-1-approved` only.

No application code, test or seed was changed in this closeout. Only documentation and evidence were added.

## 1. Suites run against `ce3bfb0`

| Suite | Command | Result | Raw output (this folder) |
|---|---|---|---|
| Frontend unit | `cd frontend && CI=true yarn test --watchAll=false --runInBand --verbose` | 30 passed, 0 failed | `frontend_unit.txt` |
| Backend | `cd backend && python -m pytest tests -n 0 -v` | 30 passed, 13 failed; Checkpoint 2 files 7 of 7 | `backend_pytest.txt` |
| Browser acceptance, preview, 390x844 and 1440x900 | `T4T_BASE_URL=<preview> python3 tests/e2e/checkpoint2_browser.py` | 54 passed, 0 failed | `browser_preview.txt`, `.json` |
| Browser acceptance, production build, both viewports | `T4T_BASE_URL=http://127.0.0.1:4173 python3 tests/e2e/checkpoint2_browser.py` | 54 passed, 0 failed | `browser_production_bundle.txt`, `.json` |

The 13 backend failures are the identical list from the accepted run (compared by test name): Checkpoint 0/1
tests that expect the full 28-city directory.

Reused, not rerun:
- The per-case city-precedence screenshots and the ten-case table in `../CHECKPOINT2_VERIFICATION_REPORT.md`
  (taken at `2c3eeb8`; no wizard source file has changed since). The precedence tests themselves were rerun
  above and pass.
- The production build. It was last built from the `ce3bfb0` working tree and produced the same file as at
  `2c3eeb8` (`main.6ba5c62b.js`); the production browser run above used that build.

Could not be run: nothing was skipped. One limit applies to all browser evidence: the test browser is headless,
so "network tab" images are renderings of its recorded request log.

## 2. Recorder and network check on the preview

Script: `closeout_network_check.py`. A driver lands on `/ottawa` and then `/tire-match` with nine attribution
parameters in the address, types a postal code and a repair note, completes Steps 1 and 2, and waits 35 seconds.
50 requests per viewport; results identical at 390x844 and 1440x900. Full log: `closeout-network-dev-preview.json`;
images: `closeout-network-dev-preview-390x844.jpg`, `-1440x900.jpg`.

**Recorder: off.** `window.rrweb` absent, no recorder script tag, no request to `recorder.js`.
**Wizard input: in no request** (address, body or Referer header), to any destination.
**Secrets: in no request.** Two workspace secret values (the GitHub token and the local database password) were
compared against every address, body and header.

| Group | Requests | What is sent | Wizard input | Attribution parameters | Secrets |
|---|---|---|---|---|---|
| **Application** | Page loads `/ottawa`, `/tire-match`, `/`; `bundle.js`; `GET /api/public/config`, `GET /api/public/locations` | GET only, no body | No | In the page address itself (that is how they arrive), and in the browser's Referer header on the API calls. Never in a body | No |
| **Development overlay** (workspace dev server) | `POST /__emergent_overlay__/report`, 8 | `{"page":…,"seq":…,"url":"/tire-match","splash":false,"errors":[]}` — path only, no query string | No | Not in the message. **Present in the Referer header** the browser attaches to it | No |
| **Preview host** (Cloudflare) | `beacon.min.js`; `POST /cdn-cgi/rum`, 3; challenge scripts and one challenge POST; cookie `cf_clearance` | Page-timing data; `location` field is the page address without the query string | No | Not in the timing message. **Present in the Referer header** on `/cdn-cgi/rum`. The challenge POST body (about 16 KB) is encoded; no plain-text match, contents not inspectable | No |
| **Fonts** (Google) | Stylesheet and three font files | GET only, no body, no cookie | No | No — Referer is the site origin only | No |

**Limitation against your condition.** The overlay's own messages contain no wizard input, attribution parameter
or secret. But every same-origin request a browser makes carries the full page address as its Referer header,
and that includes the overlay's status message and Cloudflare's `/cdn-cgi/rum`. Both go to servers that already
receive the page address when the page is opened. I kept the overlay on as instructed and am flagging this rather
than deciding it. The production build has neither the overlay nor the Cloudflare beacon.

## 3. Review of `ca726a1`

Created automatically by the Emergent workspace at 18:39 UTC, author `emergent-agent-e1`. Its subject line is the
text of my previous chat summary, which the workspace uses as the commit message. It changed two files:

| File | Change | Contents |
|---|---|---|
| `.emergent/stripped_env_names` | one line added | A list of environment-variable *names* the workspace tracks: `DATABASE_URL` and `GITHUB_TOKEN`, repeated. No values |
| `.emergent/system_deps.txt` | new file, one line | `postgresql=15+248+deb12u2` — the system package I installed for the local preview database |

Assessment: these are Emergent workspace settings, not application files. Nothing in the application, the tests,
Replit, Railway or Vercel reads them. They contain no secret values. `.emergent/` was already tracked in this
repository before Checkpoint 2 (`stripped_env_names` since `a1ee735`), so this commit follows existing practice
rather than starting it. I believe the workspace uses `system_deps.txt` to reinstall PostgreSQL after a restart,
but I have not verified that. Not reverted, history not rewritten.

The workspace has since made another uncommitted one-line change to `stripped_env_names`. I left it out of my
commit. Expect the workspace to commit such changes itself; they will go up with any later push of this branch.

## 4. Documentation updated

`CHECKPOINTS.md` and `AGENT_PROGRESS.md` now record the tested SHA, these results, the evidence links and the
limitations. Status is recorded as approved, citing your decision of 2026-11-24 ("Checkpoint 2 is APPROVED,
subject to the follow-up requirements below… Do not tag it as production-ready. Do not deploy it. Do not launch
it publicly."), with this closeout report awaiting your review. No approval tag was created.

## 5. Boundary

Not merged to `main`. Not tagged. Not deployed. Checkpoint 3 not started. Foot memo and self-hosted fonts are
not prerequisites and were not worked on.

Preview: https://wizard-cp2-review--8ktg0g80.preview.emergentagent.com/tire-match (stops when the workspace
sleeps; its local database must be recreated after a workspace restart).

---

## 6. Preview Referer behaviour (follow-up, tested at `b721fe4`)

**Change.** `frontend/craco.config.js`: the development server now sends the response header
`Referrer-Policy: no-referrer`. It is set in the dev-server header block only. `yarn build` output is unchanged
(`main.6ba5c62b.js`, the same file as at `2c3eeb8`), and `frontend/public/index.html` and `frontend/vercel.json`
contain no referrer setting, so no production setting changed. A guard test covers both points.

**Platform support.** Yes. The preview host passes the header through: `/`, `/ottawa` and `/tire-match` all return
`referrer-policy: no-referrer` at the public preview address.

**Check.** `../closeout_referrer/referrer_check.py`, synthetic values only (attribution values such as
`synsrc-q7`, typed input `K9Z 9Z9` and `plum-walrus-41`, and a synthetic stand-in secret planted in browser
storage). No workspace secret was read or compared. Headers are those the browser put on the wire. Run once
before the change and once after, at 390x844 and 1440x900.

| | Before (`ce3bfb0` config) | After (`b721fe4` config) |
|---|---|---|
| Requests whose Referer contained a synthetic attribution value | 17 and 18 (application 10, overlay 5–6, Cloudflare `/cdn-cgi/rum` 2) | **0 and 0** |
| Requests sending any Referer | 72 and 73 of about 79 | 15 of 79, all font files with `https://fonts.googleapis.com/` |
| Attribution captured on landing | yes | yes |
| Attribution unchanged after city-selector navigation, a full page load and a reload | yes | yes |
| URL city preselected; wizard progress saved in the browser | yes | yes |
| Wizard input in any address, body or header | 0 | 0 |
| Synthetic stand-in secret in any request | 0 | 0 |
| Attribution values in any request body | 0 | 0 |
| Recorder (`window.rrweb`, recorder script, recorder request) | off | off |
| Overlay present; `/__emergent_overlay__/health` | yes; 200 healthy | yes; 200 healthy |
| `/api/health` | 200 ok | 200 ok |

Per group after the change:
- **Application:** no Referer on page loads, `bundle.js` or the two API calls. The attribution values still appear
  in the address of the page the driver opened (`/ottawa?…`, `/tire-match?…`), which is how they arrive.
- **Development overlay:** `POST /__emergent_overlay__/report` sends no Referer; its body is the page path only.
  The overlay was therefore kept on.
- **Preview host:** `POST /cdn-cgi/rum`, the Cloudflare beacon script and the challenge requests send no Referer.
- **Fonts:** the stylesheet request sends no Referer. Font files send `https://fonts.googleapis.com/`, set by
  Google's own stylesheet, not by the page.

**Tests rerun at `b721fe4`** (the affected ones): frontend unit 31 of 31 (one new guard test); browser acceptance
on the preview 54 of 54 at both viewports, including the attribution tests 17, 18, A1–A3. The production-build
browser run was not repeated because the built file is identical to the one tested at `ce3bfb0`.

**Independent check.** The testing agent repeated the check with its own script and its own synthetic values at
both viewports and reported all ten requirements met, with no Referer containing attribution values in any
group. It changed no files. Report: `test_reports/iteration_4.json`.

**What remains outside repository control** (preview only, none in the production build):
- Cloudflare still loads its beacon script, sends `POST /cdn-cgi/rum` page-timing data (address without query
  string) and runs a challenge exchange whose POST body is encoded and cannot be inspected.
- Cloudflare sets cookies `cf_clearance` and `__cf_bm`.
- Cloudflare's own `/cdn-cgi/` responses carry their own `referrer-policy: same-origin`; that governs
  Cloudflare's pages, not the application's.
- As with any website, the preview host's servers receive the full address of each page opened, including any
  attribution values in it.
- Wire headers were captured for every application, overlay and `/cdn-cgi` request. The 24 requests without a
  wire record were repeat loads of font files and the Cloudflare beacon script served from the browser's cache.

**Correction to section 2.** That earlier check compared two live workspace secrets in memory (not stored or
printed). Per your instruction the new check uses synthetic values only.

## 7. Backend baseline for the 13 failing tests

**Setup used for every run below.** Emergent workspace; Python 3.11.18; local PostgreSQL 15.20 on loopback;
`APP_ENV=staging`, `SITE_INDEXING_ENABLED=false`; migrations `0001` and `0002`; seed
`python seed.py --review-cities-only` (3 market groups; cities Hamilton, Ottawa, Toronto; no subareas; zero
planning counts). Command: `python -m pytest tests -n 0 -v`. The database held the same contents after each run.

| Run | Code | Result | Output |
|---|---|---|---|
| Baseline | `checkpoint-1-approved` (`6bd57cf`), before any Checkpoint 2 work | 23 passed, **13 failed** (36 tests) | `../closeout_referrer/backend_baseline_checkpoint1_approved_three_city_seed.txt` |
| Current | `b721fe4` | 30 passed, **13 failed** (43 tests) | `../closeout_referrer/backend_head_three_city_seed.txt` |
| Earlier accepted | `ce3bfb0`, `2c3eeb8` | 30 passed, 13 failed | `backend_pytest.txt`, `../backend_pytest.txt` |

All four runs fail the same 13 tests with identical error lines (compared programmatically). Between
`checkpoint-1-approved` and now, the Checkpoint 0/1 test files, the models, both migrations, `seed_data.py` and
the API code are byte-identical; only `seed.py` gained the three-city mode and two Checkpoint 2 test files were
added. So the failures come from the database contents, not from Checkpoint 2 code.

**Earlier runs where the same tests passed** (full directory seed): Checkpoint 0 testing report
`test_reports/iteration_1.json` — "pytest suite: 21/21 tests passed"; Checkpoint 1 testing report
`test_reports/iteration_2.json` — "All 15 pytest tests passed (36 total including Checkpoint 0)". I did not run
the full seed in this workspace, because it is not approved for this preview.

| # | Test | Error in every run | Cause | Affects Checkpoint 2? |
|---|---|---|---|---|
| 1 | `test_checkpoint0::test_01_seed_has_exactly_14_groups_and_28_cities` | `3 == 14` | 3 market groups seeded, not 14 | No |
| 2 | `test_checkpoint0::test_02_toronto_has_exactly_the_three_supplied_subareas` | `[] == ['Etobicoke', …]` | No subareas seeded | No — the wizard does not use subareas |
| 3 | `test_checkpoint0::test_03_planning_counts_total_348_without_duplication` | `0 == 348` | Planning counts are zero placeholders | No |
| 4 | `test_checkpoint0::test_04_rerunning_seed_creates_no_duplicates` | totals 14/28/3/348 vs 3/3/0/0 | Compares a full-seed rerun (rolled back) with the stored three-city data | No |
| 5 | `test_checkpoint0::test_09_market_group_grants_no_service_relationship` | `NoResultFound` | Looks up a city that is not seeded | No |
| 6 | `test_checkpoint0::test_10_gatineau_uses_quebec_configuration` | `NoResultFound` | Gatineau not seeded | No |
| 7 | `test_checkpoint0::test_11_gatineau_and_kingston_pools_are_below_the_five_shop_gate` | wrong group list | Gatineau and Kingston groups not seeded; zero counts | No |
| 8 | `test_checkpoint0::test_14_new_city_is_configured_with_data_only` | `4 == 29` | Expects 28 cities plus one | No |
| 9 | `test_checkpoint0::test_architecture_endpoint_is_hidden_in_production` | totals 3/3/0/0 vs 14/28/3/348 | Stops at its directory-count line | **Partly — see below** |
| 10 | `test_checkpoint1::test_toronto_subareas_are_not_cities` | `[] == ['Etobicoke', …]` | No subareas seeded | No |
| 11 | `test_checkpoint1::test_no_city_is_live_and_ottawa_is_onboarding` | `2 == 27` | Expects 27 planned cities. Its earlier lines passed: Ottawa is `onboarding`, every other city `planned` | No |
| 12 | `test_checkpoint1::test_tax_components_are_unverified_placeholders` | empty `tax_components` | The three-city seed creates the Ontario row without tax placeholders | No — no price or tax is shown in Checkpoint 2 |
| 13 | `test_checkpoint1::test_gatineau_is_french_first_and_unpublished` | `NoResultFound` | Gatineau not seeded | No |

None is new and none is unclassified.

**Reported separately: test 9.** Because it stops at the count comparison, its remaining three assertions never
run on the three-city seed: that the staging review endpoint's response contains no database address, and that
the endpoint returns 404 in production. The Checkpoint 2 browser test 15 reads this endpoint, so it is relevant.
I checked those three assertions directly, read-only, without changing any test
(`../closeout_referrer/architecture_endpoint_direct_check.txt`): staging 200 with no `DATABASE_URL` or
`postgresql://` in the response; production 404. This is a one-off check, not a permanent test; on the
three-city seed the automated suite does not currently cover it. The earlier verification report's wording that
this test showed "the endpoint is hidden correctly" was wrong and has been corrected there.

No seed or test was changed to make anything pass.

## 8. Final state

- Final tested commit: `b721fe4` (preview configuration and one guard test). Documentation and evidence are in
  the commit after it.
- Not merged to `main`, not tagged, not deployed, not launched, Checkpoint 3 not started.
- Open limitations: the Cloudflare items in section 6; the coverage gap in section 7; browser "network" images
  are renderings of the headless browser's request log; the preview and its local database are temporary.
