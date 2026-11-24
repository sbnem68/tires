# Checkpoint 2 — closeout report for Sam's review

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
