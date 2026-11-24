# Next-Agent Handoff: Foot / Tires4Today Synergy

## Status

The previous agent workspace ran out of credits while working on the
Foot / Tires4Today synergy assessment.

**The Foot reference assessment was not committed to GitHub.**

Do not assume any Foot analysis, memo, roadmap entry, or implementation
plan was completed or saved. Treat the Foot work as incomplete unless
the next agent independently verifies it.

## Repository state at handoff

- Tires4Today repository: https://github.com/sbnem68/tires
- Current work branch: `checkpoint-2-wizard-steps-1-2-continuation`
- Last verified Checkpoint 2 commit: `f79a81c`
- Main branch: `main`
- Approved tags: `checkpoint-0-approved`, `checkpoint-1-approved`
- Foot reference repository: https://github.com/sbtheg17-market/foot
- Foot reference commit reviewed: `1213110d491c73c4879f8217176f73aeff3ef294`

## What was completed

### Checkpoint 0

Approved.

### Checkpoint 1

Approved.

### Checkpoint 2

Conditionally approved.

The first required fix was committed:

- Commit `f79a81c`
- Commit message: `fix(privacy): remove PostHog snippet, session recording and emergent-main.js from the page template; guard test`

The next agent must independently verify that the removal is complete.

### Foot reference

The Foot repository was cloned locally for inspection only.

No Foot memo, branch, or documentation commit was found remotely.

The Foot reference work is therefore incomplete.

## Required next-agent work

### 1. Verify analytics removal

Verify that `frontend/public/index.html` contains no:

- PostHog snippet
- PostHog page-view capture
- Click autocapture
- Session recording
- Requests to `ap.emergent.sh`
- `emergent-main.js`

Run and document:

- Relevant frontend tests
- Relevant backend tests
- Browser tests at 390x844 and 1440x900
- Production build
- Network request checks confirming no third-party analytics or
  session-recording requests

Do not replace the removed scripts with another analytics provider.
Do not add cookies, fingerprinting, session recording, or event capture.

### 2. Implement strict city precedence

Implement and test the strict city-precedence rule:

1. URL city parameter wins first.
2. Saved wizard progress wins second.
3. If neither exists, no city may be selected by default.
4. Do not use the last city selected elsewhere on the site.
5. A URL city is applied once per browser session so a refresh does
   not undo a manual city change.
6. If a URL city replaces a different saved city, return the driver
   to Step 1, show the changed city, preserve other wizard answers,
   and preserve the original attribution record.

Add or update tests for:

- URL city preselect
- Manual city change after URL preselect
- Refresh preserving manual city change
- No URL and no saved progress leaves city unselected
- No URL but saved progress restores saved city
- Original attribution remains locked for 30 days

### 3. Complete the Foot reference assessment

Create a documentation-only file:

`FOOT_REUSE_ADAPTATION.md`

This is a reference memo only.

It does **not** authorize:

- Copying source code
- Porting modules
- Installing dependencies
- Changing architecture
- Starting future checkpoint work
- Modifying application code, migrations, seed data, or tests

The memo must treat Foot licensing as unresolved.

A `package.json` MIT field is not sufficient proof of repository-wide
permission. No source file may be copied until Sam confirms ownership
or permission.

## Foot assessment scope

Assess Foot only for potential reference value in these future
checkpoints:

- Checkpoint 6 — Offer matching and location eligibility
- Checkpoint 7 — Lead capture, duplicate protection, and notifications
- Checkpoint 8 — Lead routing, transition rules, and shop workflow
- Checkpoint 9 — Quotes, booking time handling, timezones, and DST
- Checkpoint 10 — Install completion and referral reconciliation
- Checkpoint 11 — Operator queues and admin interface patterns

Use these reference categories:

- Engineering pattern to reimplement independently
- Potential source adaptation requiring permission and separate approval
- Reference for test design only
- Do not use

“Adapt” is an assessment category, not authorization.

## Foot business-rule boundaries

Do not transfer these Foot-specific rules into Tires4Today:

- Self-service booking slots
- Automatic appointment confirmation
- Provider and care-recipient entities
- Postal-prefix coverage as a distance filter
- In-memory notification bus as production delivery infrastructure
- Foot-specific state-machine states

Tires4Today must retain its own rules:

- No appointment is promised before shop confirmation.
- Shop-organic leads are never counted as Tires4Today referrals.
- Demo data is excluded from production and business metrics.
- Attribution is preserved and original attribution remains locked
  for 30 days.
- Quotes expire 72 hours after shop confirmation.
- Referral fees are calculated only for completed referred installs.

## Required memo structure

Use these headings:

# Foot Reuse and Adaptation Assessment

## Purpose and scope
## Source reviewed
## License and permission status
## Architecture comparison
## Reference categories
## Checkpoint-by-checkpoint assessment
## Business-rule differences
## Test scenarios worth independently recreating
## Risks and open questions
## Approval boundary and change log

Use commit-pinned links to the exact Foot files reviewed.

Mark every unverified item as unverified.

Do not invent paths, behaviors, tests, or implementation details.

## Required roadmap entry

Add a dated reference-only entry to `ROADMAP.md`:

### 2026-11-24 — Foot reuse assessment documented

- Checkpoint: 6, 7, 8, 9, 10, 11
- Type: Reference note
- Requested by: Sam
- Authorization: Documentation only
- Reason: Record which Foot workflow patterns and tests may be
  independently reimplemented, and which source files require
  license confirmation before any copying.
- Impact: Adds FOOT_REUSE_ADAPTATION.md. No code, schema, dependency,
  or architecture changes.
- Source-copy permission: Unresolved; not granted
- Implementation approval: Not granted
- Current checkpoint: 2, unchanged
- Status: Reference only; memo awaiting review

Do not record approval of the memo findings before Sam reviews them.

## GitHub handoff rules

Create a separate documentation branch:

`docs/foot-reference-assessment`

Commit only:

- `FOOT_REUSE_ADAPTATION.md`
- The `ROADMAP.md` reference-only change-log entry

Do not include:

- `foot-reference/` clone
- Application code
- Migrations
- Seed data
- Tests
- Dependencies
- Lockfiles
- Configuration
- Secrets
- Personal information
- Database exports

Do not merge automatically.
Do not tag a checkpoint as approved.

## After the Foot memo

Return to:

`checkpoint-2-wizard-steps-1-2-continuation`

Then:

1. Verify analytics removal.
2. Implement strict city precedence.
3. Re-run all relevant tests.
4. Rebuild the production bundle.
5. Provide a new preview link.
6. Provide updated screenshots.
7. Provide test results.
8. Provide commit links and changed-file list.
9. Confirm no customer data is collected.
10. Confirm no lead is created.
11. Confirm no server write occurs.
12. Confirm original attribution remains locked for 30 days.

Then stop.

Do not begin Checkpoint 3 until Sam explicitly approves the updated
Checkpoint 2 report.

## Checkpoint 3 boundary

Checkpoint 3 is the Wheel-Size widget and manual tire-size entry.

Do not begin Checkpoint 3 until Sam explicitly approves the updated
Checkpoint 2 report.

Checkpoint 3 must include:

- The exact Wheel-Size.com embed provided by Sam
- Manual tire-size entry as a fallback
- Vehicle and tire-size capture
- Mobile-first layout
- Attribution preservation
- No lead creation
- No server writes until a later approved checkpoint
