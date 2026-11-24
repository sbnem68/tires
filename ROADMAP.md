# Tires4Today — Canonical Build Roadmap

> **This file is the single source of truth for project scope, checkpoint order, approval gates, and approved scope changes.**
> **Every agent must read this file before starting work and update it whenever a scope change is approved.**

Repository: https://github.com/sbnem68/tires

Tires4Today matches drivers who need tires with local partner shops and presents one all-in installed price. The intended flow runs from city-aware discovery and tire intake through real offers, lead handling, shop-confirmed quotes and bookings, completed installs, and referral reconciliation.

## 2. How Every Agent Must Use This File

Before coding, every agent must:

1. Read `ROADMAP.md`, `CHECKPOINTS.md`, `AGENT_PROGRESS.md`, `README.md`, and recent commits.
2. Identify the current approved checkpoint and its exact remaining work.
3. Audit completed work and provide evidence before changing anything.
4. Never repeat or rebuild completed work.
5. Never begin a later checkpoint without Sam's explicit approval.
6. Never add features outside the current checkpoint.
7. Record every approved scope change, upgrade, or essential deviation in the Change Log.
8. Update `AGENT_PROGRESS.md` after every meaningful task.
9. Commit and push frequently.
10. Before a session ends or approaches a usage limit, commit all work and push a timestamped backup branch.

## 3. Build Method

- Build in approved checkpoints; do not build the entire system at once.
- Complete one checkpoint, test it, provide a preview or screenshots, and wait for Sam's approval before proceeding.
- At the end of every checkpoint, report:
  1. What was built.
  2. What was tested.
  3. Screenshots or a live preview link.
  4. Test results.
  5. Known limitations.
  6. The next checkpoint plan.

## 4. Current Status Table

| Checkpoint | Scope | Status |
|---|---|---|
| 0 | Project setup and architecture | Approved with conditions; deployment remains on hold |
| 1 | City-aware landing pages | Approved |
| 2 | Tire Match Wizard — Steps 1 and 2 | In progress; awaiting completion and approval |
| 3 | Wheel-Size widget and manual tire-size entry | Not started |
| 4 | Preferences and lead intent | Not started |
| 5 | Shop and offer database | Not started |
| 6 | Offer matching and display | Not started |
| 7 | Lead capture and operator alert | Not started |
| 8 | Lead routing and shop workflow | Not started |
| 9 | Quote card and booking | Not started |
| 10 | Install and referral reconciliation | Not started |
| 11 | Admin dashboard polish | Not started |
| 12 | Toronto multi-city test | Not started |
| 13 | WordPress embed and deployment | Not started |
| 14 | Final end-to-end test | Not started |

**Current checkpoint:** Checkpoint 2. Checkpoint 3 must not start until Checkpoint 2 is completed, verified, and explicitly approved by Sam.

## 5. Global Build Rules

1. Complete one checkpoint at a time.
2. Do not begin the next checkpoint until Sam approves the current one.
3. Provide a live preview or screenshots after every checkpoint.
4. Provide test results after every checkpoint.
5. Do not add features outside the current checkpoint.
6. Do not use fake inventory.
7. Do not display inactive or expired offers.
8. Do not promise appointments before shop confirmation.
9. Do not claim shop organic leads as Tires4Today referrals.
10. Keep the admin dashboard mobile-friendly.
11. Keep the public intake form under two minutes.
12. Make every city launchable without rebuilding the app.
13. Make every shop launchable without rebuilding the app.
14. Preserve all attribution data.
15. Build for production, not for a demo.
16. Never store, request, repeat, or commit secrets, API keys, tokens, passwords, or database URLs.
17. Use versioned migrations. Never overwrite or delete prior migration history.
18. Do not deploy to Railway or Vercel without explicit approval.

## 6. Checkpoints 0 Through 14

Every checkpoint below has a defined goal, deliverables, exclusions, tests, approval gate, and status. The current status is governed by Section 4; do not infer approval from code being present or tests passing.

### Checkpoint 0 — Project Setup and Architecture

**Goal:** Establish the foundation without building user-facing features.

**Deliverables**

1. Create the project repository.
2. Choose and document the stack: Next.js or React, Tailwind CSS, PostgreSQL, and a Railway or Vercel deployment plan.
3. Create database schema for shops, shop offers, leads, quotes, and installs.
4. Create an environment-variable template.
5. Create a basic project README.
6. Create a staging environment.
7. Confirm the project runs locally and deploys successfully, subject to the deployment hold below.

**Do not build:** Intake form, offers, admin dashboard, or notifications.

**Test criteria**

- Project runs locally.
- Database connects successfully.
- Database migrations run successfully.
- Project deploys to Railway or Vercel and the staging URL loads without errors when deployment is explicitly approved.
- Environment variables are documented without exposing their values.

**Approval gate:** Sam approves architecture, stack, database schema, and deployment setup.

**Current status:** Approved with conditions. Railway/Vercel deployment remains outstanding and on hold until explicitly approved.

### Checkpoint 1 — City-Aware Landing Pages

**Goal:** Build the public Tire Match landing page and city routing.

**Deliverables**

1. Tires4Today landing page.
2. City-aware routes: `/ottawa`, `/toronto`, and `/hamilton`.
3. Hero, How It Works, FAQ, and footer sections.
4. Capture URL parameters: `city`, `source`, `campaign`, `shop`, `package`, `price`, `utm_source`, `utm_medium`, and `utm_campaign`.
5. Preserve attribution parameters in browser storage and navigation.
6. Mobile-first layout and page-level SEO controls.

Ottawa live-state copy:

- Heading: **Winter Tires Installed in Ottawa**
- Supporting line: **Real All-In Prices. Same-Week Booking.**
- Primary action: **Find My Tire Match**
- Trust line: **No cost to request a quote. All-in pricing includes tires, mounting, balancing, disposal, and taxes.**

**Do not build:** Later wizard steps, wheel-size widget, offers, lead capture, admin tools, notifications, quotes, bookings, or reconciliation.

**Test criteria**

- `/ottawa`, `/toronto`, and `/hamilton` load correctly.
- City name changes dynamically.
- URL parameters are captured and preserved.
- Page works on mobile and loads without console errors.
- No fake prices or fake shop names are displayed.

**Approval gate:** Sam approves city pages, layout, copy, and URL parameter capture.

**Current status:** Approved.

### Checkpoint 2 — Tire Match Wizard, Steps 1 and 2

**Goal:** Build the first two steps of the intake wizard.

**Deliverables**

1. Step 1: city and location.
2. Step 2: need selection.
3. Progress indicator and back navigation.
4. Save partial progress in browser storage.
5. Mobile-first wizard.

**Step 1 fields:** City dropdown, optional postal code, and travel radius.

**Step 2 options:** Buy 2 tires; Buy 4 tires; winter tire changeover; tire repair or inspection; and “I'm not sure — help me choose.”

**Routing logic**

- Buy 2 and Buy 4 continue toward vehicle and tire-size selection.
- Winter changeover asks whether new tires are also needed.
- Repair asks for a short issue description.
- “I'm not sure” continues through the eventual intake and marks the lead as guidance needed; do not build those later steps in this checkpoint.

**Do not build:** Vehicle/tire-size entry, preferences, matching, offers, contact capture, lead creation, notifications, or later wizard screens.

**Test criteria**

- City can be selected manually and is preselected when URL contains `city=ottawa`.
- Forward/back navigation preserves selections.
- Each need type resolves to the correct next-step intent.
- Wizard works on mobile.
- Answers persist after refresh without being sent to the server.

**Approval gate:** Sam approves Steps 1 and 2.

**Current status:** In progress; awaiting completion and approval. Existing branch documentation reports 18 frontend tests passing and a successful production build; end-to-end preview verification remains incomplete. These prior reports are not proof of checkpoint approval.

### Checkpoint 3 — Wheel-Size Widget and Manual Tire-Size Entry

**Goal:** Build the vehicle and tire-size step.

**Deliverables**

1. Step 3 for vehicle and tire size.
2. Embed the Wheel-Size.com widget.
3. Style the widget to match Tires4Today.
4. Always offer manual tire-size entry.
5. Capture make, model, year, optional trim, tire size, tire type, and optional current tire condition.
6. Apply loose tire-size validation and ensure the widget works on mobile.

**Widget integration**

```html
<h3>
  <a title="Wheel fitment and tire size guide and knowledge base" href="https://www.wheel-size.com">
    Wheel-Size.com
  </a>
</h3>
<div id="ws-widget-1e474a"></div>
<script src="//services.wheel-size.com/code/ws-widget.js"></script>
<script>
  var widget = WheelSizeWidgets.create('#ws-widget-1e474a', {
    uuid: '1e474a81e41347ceb320b2556ee93ba9',
    type: 'finder-v2',
    width: '100%'
  });
</script>
```

Tire types: Winter, All-season, Summer, Performance, Unknown. Conditions: New, Good, Worn, Damaged, Unknown.

**Do not build:** Preference/urgency steps, offers, lead capture, notifications, or later workflow.

**Test criteria**

- Widget loads and is usable on mobile.
- Manual entry works for `205/55R16` and `225/65R17`.
- Driver can proceed without using the widget.
- Widget and manual selections save correctly.
- No console errors.

**Approval gate:** Sam approves the Wheel-Size widget integration and manual entry.

**Current status:** Not started.

### Checkpoint 4 — Preferences and Lead Intent

**Goal:** Build the preference and urgency steps.

**Deliverables**

1. Step 4: preferences.
2. Capture priority, budget, and urgency.
3. Add validation and persist selections.

**Options**

- Priority: Lowest price, Known brand, Quality used option, Fastest appointment, Best value.
- Budget: Under $400, $400–$600, $600–$800, $800–$1,000, Over $1,000, Not sure.
- Urgency: Today, Tomorrow, This week, Next week, Flexible.

**Do not build:** Offer matching/display, contact capture, lead submission, operator workflows, or later steps.

**Test criteria**

- Driver can select priority, budget, and urgency.
- Selections persist when navigating backward.
- Form works on mobile.

**Approval gate:** Sam approves the preferences step.

**Current status:** Not started.

### Checkpoint 5 — Shop and Offer Database

**Goal:** Build the backend that stores shops and real offers.

**Deliverables**

1. Shop and offer data models.
2. ABC Auto as a test shop and four test offers, clearly marked as demo data in staging.
3. Admin interfaces to add, edit, pause, and reactivate shops.
4. Admin interfaces to add, edit, activate, deactivate, and expire offers.
5. Enforce that only active, valid offers are eligible for display.

**ABC Auto test data**

- Shop: ABC Auto; city: Ottawa; status: Active for staging tests only (`is_demo=true`); used tires: yes; capacity: six cars per day; top sizes: 205/55R16, 215/60R16, 225/65R17. Never treat this test status as a real production partner.
- Two Toyo tires installed: $260 all-in.
- Two Bridgestone tires installed: $340 all-in.
- Four Sumitomo tires installed: $390 all-in.
- Four Goodyear tires installed: $570 all-in.
- Every price includes tires, mounting, balancing, disposal, and taxes.

**Do not build:** Treat demo data as a real partner or production inventory; build public matching, lead routing, quotes, bookings, or reconciliation.

**Test criteria**

- ABC Auto and its four offers are visible in the appropriate staging/admin panels.
- Offers can be edited, deactivated, and expired.
- Deactivated and expired offers are not publicly displayed.
- Admin can add a shop and an offer.

**Approval gate:** Sam approves the shop and offer database.

**Current status:** Not started.

### Checkpoint 6 — Offer Matching and Display

**Goal:** Build the offer-matching engine and public offer cards.

**Deliverables**

1. Match on city, tire size, package, tire type, budget, urgency, service area, install capacity, and shop status.
2. Build offer cards that show all-in price and installation city.
3. Show only active, valid offers.
4. Prioritize a shop-specific offer when a driver arrives through a shop-specific link.
5. Show a no-match state and a Request This Offer action.

**Offer card content**

```text
Set of 4 — Goodyear
205/55R16
$570 all-in
Includes: 4 tires, mounting, balancing, disposal, and taxes
ABC Auto — Ottawa
Same-day or next-day appointment available
[Request This Offer]
```

**No-match copy**

> No exact match for [Tire Size] right now.
>
> We can still check nearby sizes and partner-shop inventory. Submit your request and we'll text you available options.

**Do not build:** Fake inventory, inactive/expired offers, lead creation or operator workflow (Checkpoint 7 onward), or unconfirmed appointment promises.

**Test criteria**

- Driver selecting 205/55R16 and four winter tires sees the Goodyear offer.
- Driver selecting two tires sees Toyo and Bridgestone offers.
- An unavailable size shows the no-match state.
- `shop=abc-auto` prioritizes ABC Auto; a general Ottawa ad shows available Ottawa offers.
- No inactive, expired, or fake offers appear.

**Approval gate:** Sam approves offer matching and public offer display.

**Current status:** Not started.

### Checkpoint 7 — Lead Capture and Operator Alert

**Goal:** Build the final intake step and lead creation.

**Deliverables**

1. Step 6: contact and submit.
2. Create lead records and store attribution.
3. Send driver confirmation and operator alert.
4. Create an admin lead view.

**Contact fields:** Required first name and mobile phone; optional email; preferred contact method (Text or Call); required consent checkbox (“I agree to be contacted about my tire request.”); optional notes.

**Attribution fields:** City, source, campaign, shop, package, price, UTM source/medium/campaign, referrer URL, landing URL, tire size, vehicle details, and selected offer.

**Driver confirmation**

> Thanks, [First Name]. Your Tire Match request has been received.
>
> We're checking available options for: [Vehicle], [Tire Size], [City].
>
> We'll text you shortly with available all-in installed options.

**Operator alert fields:** Lead name and phone, city, vehicle, tire size, need, budget, urgency, source, selected offer, and dashboard link. Example values in templates must remain sample copy, never customer data.

**Do not build:** Shop routing/confirmation, quotes, appointment booking, install reconciliation, or referral payments.

**Test criteria**

- Complete lead submission works and phone validation is applied.
- Consent is required.
- Lead appears in admin and all attribution fields are saved.
- Driver confirmation and operator alert are sent through the approved email-first setup.
- Refreshing after submit does not create a duplicate lead.

**Approval gate:** Sam approves lead capture and operator alerts.

**Current status:** Not started.

### Checkpoint 8 — Lead Routing and Shop Workflow

**Goal:** Build the operator workflow for routing leads to shops.

**Deliverables**

1. Routing logic and operator shop assignment.
2. Shop alert and shop confirmation recording.
3. Quote creation and acceptance tracking.
4. Appointment booking after shop confirmation.
5. Lead status tracking: New, Matched, Quoted, Booked, Completed, Lost, Needs Operator Review.

**Routing priority:** (1) shop-specific link, (2) driver-selected offer, (3) best available shop match, (4) operator review.

**Shop alert content:** Shop name, package type, brand tier, tire size, budget, urgency; ask the shop to confirm availability, all-in installed price, and best appointment time; sign as Sam from Tires4Today.

**Do not build:** Bookings before shop confirmation, install/referral reconciliation, or payment processing.

**Test criteria**

- Operator can assign ABC Auto, send an alert, and record confirmation.
- Operator can create a quote, mark it accepted, and book an appointment.
- Lead status updates correctly.
- Booking is impossible until shop confirmation is recorded.

**Approval gate:** Sam approves lead routing and shop workflow.

**Current status:** Not started.

### Checkpoint 9 — Quote Card and Booking

**Goal:** Build the customer quote and booking flow.

**Deliverables**

1. Quote generator and 72-hour expiry.
2. Customer quote-acceptance flow and appointment booking.
3. Counter contact name and booking trail.

**Quote content:** Shop and address, vehicle, tire size, package, brand, condition, all-in price, included tires/services/taxes, confirmed appointment day/time, counter contact, expiration date/time, and an acceptance instruction.

Example closing copy: “Quote valid until [Date and Time]. Reply YES to lock it in, or tell me a different day.”

**Do not build:** Install completion, referral-fee reconciliation, weekly statements, or payment tracking.

**Test criteria**

- Quote generates correctly and includes all-in pricing.
- Quote expires after 72 hours; expired quotes cannot be accepted.
- Customer can accept, appointment is saved, counter contact is stored, and booking trail is retained.

**Approval gate:** Sam approves the quote and booking flow.

**Current status:** Not started.

### Checkpoint 10 — Install and Referral Reconciliation

**Goal:** Build the completed-install and payment workflow.

**Deliverables**

1. Install record and referral-fee calculation.
2. Payment-status tracking: Pending, Paid, Disputed.
3. Friday reconciliation view and weekly statement generator.
4. Operator actions to mark installs complete and referral fees paid.

**Default referral fees:** $45 per completed set of four; $22.50 per completed pair.

**Weekly statement:** Identify the shop and week, list referred installs completed during that week, show the referral fee, and provide the approved payment instructions and a short closing.

**Do not build:** Count inquiries, quotes, tentative appointments, demo installs, or shop-organic leads as referral installs.

**Test criteria**

- Operator can mark an install complete.
- Referral fee, payment status, statement, and reconciliation totals are correct.
- Only Tires4Today-referred installs appear; shop-organic leads are excluded.

**Approval gate:** Sam approves install and reconciliation workflow.

**Current status:** Not started.

### Checkpoint 11 — Admin Dashboard Polish

**Goal:** Make the operator dashboard production-ready.

**Deliverables**

1. Dashboard home and lead pipeline.
2. Shop, offer, quote, booking, and reconciliation panels.
3. Filters, search, and mobile-friendly layout.
4. Location management and expansion-readiness view per the Location Directory Addendum.

**Dashboard views:** New, matched, quoted, booked, completed, lost, and review-needed leads; active and paused shops; active and expired offers; pending payments; paid referrals.

**Do not build:** Public customer-data access or automatic city launches.

**Test criteria**

- Dashboard loads and is usable on a phone.
- Operator can quickly find a lead and filter by city, status, and shop.
- Weekly totals are visible.
- Customer data is not exposed publicly.

**Approval gate:** Sam approves the admin dashboard.

**Current status:** Not started.

### Checkpoint 12 — Toronto Multi-City Test

**Goal:** Prove the system works for a second city without rebuilding.

**Deliverables**

1. Add a hypothetical Toronto test shop and four test offers in staging.
2. Create `/toronto` city page and a Toronto-specific intake link.
3. Test the full lead flow for Toronto and keep Ottawa and Toronto records separate.

**Toronto test data:** Toronto Tire Centre; two Sailun tires installed $240 all-in; two Michelin tires $360 all-in; four Laufenn tires $420 all-in; four Continental tires $620 all-in. Keep all hypothetical data clearly marked as staging/demo.

**Do not build:** Production launch, WordPress integration, or unapproved real partner/inventory claims.

**Test criteria**

- `/toronto` loads correctly.
- Toronto drivers see only eligible Toronto offers; Ottawa drivers see Ottawa offers.
- Toronto leads do not route to ABC Auto, and Ottawa leads do not route to Toronto shops.
- City attribution is saved and admin can filter by city.

**Approval gate:** Sam approves multi-city functionality.

**Current status:** Not started.

### Checkpoint 13 — WordPress Embed and Deployment

**Goal:** Make the approved system deployable and embeddable.

**Deliverables**

1. Production deployment to the approved host and custom domain.
2. Production database.
3. WordPress iframe and shortcode options.
4. Test embed on a WordPress page and test the production lead flow.

Example iframe:

```html
<iframe
  src="https://tires4today.ca/tire-match?city=ottawa"
  width="100%"
  height="900"
  style="border:0; border-radius:12px;"
  loading="lazy"
></iframe>
```

Example shortcode: `[tires4today_tire_match city="ottawa"]`

**Do not build:** Any deployment or production data migration without explicit approval. Staging data must never enter public production results.

**Test criteria**

- Approved production site and custom domain load.
- Production database is ready and separate from staging.
- Lead submission and operator alert work in production.
- WordPress iframe and shortcode work.
- No staging data appears in production.

**Approval gate:** Sam approves production deployment and WordPress integration.

**Current status:** Not started; deployment remains on hold until explicit approval.

### Checkpoint 14 — Final End-to-End Test

**Goal:** Test the complete business flow from ad click to paid referral.

**Deliverables**

- Run and record the full business-flow test below.
- Confirm the flow needs no manual database edits and meets every final acceptance criterion.

**Test scenario**

1. Driver clicks the Ottawa Kijiji ad.
2. Driver lands on `/ottawa`.
3. Driver selects Ottawa.
4. Driver selects Buy 4 tires.
5. Driver uses the Wheel-Size widget or manually enters 205/55R16.
6. Driver selects winter tires.
7. Driver selects a budget under $600.
8. Driver selects This week.
9. Driver sees the ABC Auto Goodyear offer at $570 all-in.
10. Driver requests the offer.
11. Driver enters name and phone.
12. Lead is created.
13. Operator receives an alert.
14. Operator routes the lead to ABC Auto.
15. ABC Auto confirms $570 all-in and Saturday at 10:00 AM.
16. Operator sends the quote.
17. Driver accepts.
18. Appointment is booked.
19. Install is marked complete.
20. Referral fee is calculated.
21. Weekly statement is generated.
22. Payment is marked paid.

**Do not build:** New features during final acceptance; fix only in-scope defects through the approved change process.

**Test criteria**

- Full flow works without manual database edits.
- No fake data is displayed.
- No appointment is promised before shop confirmation.
- Shop-organic leads are not counted as Tires4Today referrals.
- Attribution is preserved.
- Quote expires after 72 hours and referral fee is correct.
- Admin is usable on a phone.
- Ottawa and Toronto are separated.
- WordPress embed and approved production deployment work.

**Approval gate:** Sam approves the system for live use.

**Current status:** Not started.

## 7. Location Directory Addendum

### Purpose

Keep these concepts separate:

1. **City:** driver's selected location and shop's physical location.
2. **Market group:** prospecting/reporting group containing one or more cities.
3. **Toronto subarea:** North York, Scarborough, or Etobicoke.
4. **Prospect:** shop we may call.
5. **Active partner:** onboarded shop approved to receive referrals.
6. **Live offer:** published, current offer belonging to an active partner.

**A prospect count must never become a public partner count.**

### A. Seed the Location Directory

| Tier | Priority | Market group | Cities / subareas | Province | Planning prospects |
|---|---:|---|---|---|---:|
| 1 | 1 | Ottawa | Ottawa | Ontario | 21 |
| 1 | 2 | Gatineau | Gatineau | Quebec | 4 |
| 2 | 3 | Burlington corridor | Burlington, Hamilton, Oakville, Milton | Ontario | 47 |
| 2 | 4 | Toronto | Toronto; subareas: North York, Scarborough, Etobicoke | Ontario | 57 |
| 2 | 5 | Mississauga–Brampton | Mississauga, Brampton | Ontario | 30 |
| 2 | 6 | York Region | Vaughan, Markham, Richmond Hill | Ontario | 34 |
| 3 | 7 | Waterloo–Wellington | Kitchener, Waterloo, Cambridge, Guelph | Ontario | 42 |
| 3 | 8 | London | London | Ontario | 13 |
| 3 | 9 | Niagara | St. Catharines, Niagara Falls, Welland | Ontario | 25 |
| 3 | 10 | Windsor | Windsor | Ontario | 16 |
| 4 | 11 | Barrie–Peterborough planning group | Barrie, Peterborough | Ontario | 18 |
| 4 | 12 | Kingston | Kingston | Ontario | 4 |
| 4 | 13 | Durham | Oshawa, Whitby, Pickering | Ontario | 32 |
| 4 | 14 | Sudbury | Sudbury | Ontario | 5 |

Expected totals: **14 market groups, 28 cities, 3 Toronto subareas, and 348 planning prospects.**

These are supplied planning counts, not verified business listings. Do not create 348 fictional shop or prospect records from them.

### B. Database Structure

`market_groups`:

- `id`, `name`, `slug`, `tier`, `priority_order`, `planning_prospect_count`, `count_source`, nullable `count_verified_at`, `notes`.

`cities`:

- `id`, `market_group_id`, `name`, `slug`, `province_code`, `country_code`, `timezone`, `default_locale`, `supported_locales`, `launch_status`, `public_listing_enabled`, `launched_at`, `created_at`, `updated_at`.
- Launch statuses: `planned`, `onboarding`, `live`, `paused`.

`location_subareas`:

- `id`, `city_id`, `name`, `slug`, `aliases`.
- North York, Scarborough, and Etobicoke belong to Toronto; they are not additional launch cities.

Document these foreign keys: `shops.city_id`, `prospects.city_id`, `leads.requested_city_id`, and `offers.shop_id`. An offer's installation city is derived from its shop.

Keep distinct: driver location, requested search city, selected shop location, and original landing-page city. Changing the search city must not erase original attribution.

### C. Initial Launch State

- Seed all cities as `planned`; Ottawa may be `onboarding` for an explicitly approved initial pilot.
- Do not mark Ottawa live just because ABC Auto exists as demo data.
- ABC Auto is hypothetical/testing until Sam approves real operating details.
- Demo shops, offers, leads, and installs must be labelled in staging, excluded from production public results, and excluded from real business metrics.
- Public launch requires Sam's approval and real active partners with publishable offers.
- Existing checkpoints may list cities for review; listing or being `onboarding` does not mean the city is live or has inventory.

### D. Public Location Selector

- Let users search for their city.
- Show live cities under **Available locations**.
- Show planned cities separately under **Coming soon — register interest**.
- For an unlaunched location, show:

  > We're not taking tire-match requests in this location yet. You can register interest, or choose an available location you're willing to visit.

- Interest registration is optional; explain its purpose; keep it separate from active quote requests; do not promise availability, notify a shop, or count it toward bookings or installs.
- Do not publish 28 near-identical live landing pages.
- Keep planned pages private or `noindex`; publish substantive city pages only after launch approval.

### E. Local Search and Routing

- Market groups are for prospecting and reporting, not proof of proximity.
- Barrie and Peterborough must not be treated as adjacent.
- A Burlington driver must not automatically receive every Hamilton, Oakville, and Milton offer.
- Toronto drivers may select North York, Scarborough, or Etobicoke.
- Version 1 supports explicit city selection and opt-in nearby cities.
- Display the installation city on every offer.
- Claim distance filtering only when coordinates and distance calculations are implemented. Otherwise label travel distance as a preference for operator review.
- Never silently reroute a shop-specific request.

### F. Expansion Gate

- Open a new city only when the previous city has at least **5 active partner shops** and at least **10 completed referred installs per week**.
- “Deals” means completed installs, not inquiries, quotes, or tentative appointments.
- Measure the most recent completed calendar week and display the measurement period.
- Do not launch automatically. Show: **“Expansion threshold met — awaiting Sam's approval.”**
- Gatineau and Kingston each have only four planning prospects. Do not silently lower the five-shop rule.
- Flag this conflict and let Sam choose: expand prospect research; approve a documented exception; or approve a defined combined-market measurement.
- Store overrides with `approved_by`, `approved_at`, `reason`, and `measurement_scope`.
- This rule controls expansion, not the first pilot. An explicitly approved initial pilot may have fewer shops.

### G. Admin Location View

Show market group, tier, priority, city, launch status, group-level planning prospect count, imported prospect count, contacted prospect count, active partner count, publishable offer count, completed installs in the last full week, expansion readiness, and launch approval status.

Keep planning counts visually distinct from actual counts.

### H. Gatineau Configuration

- Support Quebec as a separate province configuration.
- Prepare French and English content.
- Use province-specific tax and disclosure settings.
- Review privacy and consent wording separately.
- Do not copy Ontario assumptions into Gatineau.
- Do not claim Quebec launch readiness until Sam approves.

### I. Checkpoint Integration

- **Checkpoint 0:** Add market groups, cities, subareas, and foreign keys. Show proposed seed data and relationships; stop for approval.
- **Checkpoint 1:** Demonstrate live, planned, onboarding, and paused states. Verify planned locations do not imply availability; stop for approval.
- **Checkpoint 5:** Show prospects versus partners versus demo shops. Verify group counts are not duplicated across cities; stop for approval.
- **Checkpoint 6:** Test city selection, Toronto subareas, and opt-in alternatives. Verify grouping alone does not qualify a shop as nearby; stop for approval.
- **Checkpoint 12:** Demonstrate Ottawa and Toronto in staging. Verify all 28 cities and 3 subareas exist without fictional live partners or offers; stop for approval.
- **Final release:** Confirm production has only Sam-approved live locations, real approved partners, and publishable offers; stop for explicit release approval.

### J. Required Tests

1. Seed contains exactly 14 market groups and 28 cities.
2. Toronto has exactly the three supplied subareas.
3. Planning counts total 348 without duplication.
4. Rerunning seeds creates no duplicate cities or groups.
5. Group prospect totals are not treated as partner totals.
6. Planned cities do not show live inventory.
7. Changing search city preserves original campaign attribution.
8. Toronto subarea selection does not create a new city.
9. Barrie does not automatically match Peterborough shops.
10. Gatineau uses Quebec configuration.
11. Gatineau and Kingston flag the five-shop gate conflict.
12. Demo installs never satisfy expansion thresholds.
13. Expansion readiness does not automatically launch a city.
14. A new city can be configured without modifying core code.

## 8. Change Log and Scope Control

Any agent who discovers a necessary scope change, upgrade, or deviation must:

1. Stop before implementing it if it is outside the current approved checkpoint.
2. Describe the proposed change, why it is necessary, and its impact.
3. Obtain Sam's explicit approval.
4. Record the approved change in this section before or alongside implementation.
5. Reference the change in the relevant checkpoint and in `AGENT_PROGRESS.md`.

Do not silently expand scope. Do not mark a change approved without Sam's confirmation.

Use this template for future entries:

```markdown
### YYYY-MM-DD — Short title

- Checkpoint: [number and name]
- Type: Scope addition / Essential upgrade / Correction / Deferral
- Proposed by: [agent or person]
- Approved by: Sam
- Approved at: YYYY-MM-DD HH:MM TZ
- Reason: [why the change is necessary]
- Impact: [files, schema, tests, timeline, or dependencies affected]
- Status: Approved / Implemented / Deferred
```

### 2026-11-24 — Canonical roadmap established

- Checkpoint: All
- Type: Documentation and process upgrade
- Proposed by: Sam
- Approved by: Sam
- Approved at: 2026-11-24
- Reason: Ensure every agent has one authoritative roadmap, understands checkpoint order, and does not repeat completed work.
- Impact: Adds `ROADMAP.md` as the canonical build plan and change log. Agents must read and update it.
- Status: Implemented

### 2026-11-24 — Location directory and launch controls added

- Checkpoint: 0, 1, 5, 6, 12, and final release
- Type: Scope addition
- Proposed by: Sam
- Approved by: Sam
- Approved at: 2026-11-24
- Reason: Prepare for the full expansion footprint without making every location publicly active, and prevent prospect counts from becoming public partner counts.
- Impact: Adds market groups, cities, subareas, launch statuses, expansion gates, Quebec configuration, and related tests.
- Status: Approved; implementation follows checkpoint integration rules.

## 9. Agent Session Protocol

**At the start of every session**

1. Read `ROADMAP.md`, `CHECKPOINTS.md`, `AGENT_PROGRESS.md`, `README.md`, and recent commits.
2. Confirm the current approved checkpoint.
3. Audit completed versus remaining work.
4. State the exact remaining scope before coding.

**At the end of every meaningful task**

1. Update `AGENT_PROGRESS.md`.
2. Run relevant tests.
3. Commit with a clear message.
4. Push to the working branch.

**Before ending a session or approaching a usage limit**

1. Commit all work.
2. Push the working branch.
3. Create and push a timestamped backup branch.
4. Record the backup branch name in `AGENT_PROGRESS.md`.

## 10. Definition of Done

A checkpoint is complete only when:

1. All scoped deliverables are implemented.
2. All required tests pass.
3. No out-of-scope features were added.
4. No secrets or customer data are exposed.
5. A working preview or screenshots are provided.
6. Known limitations and deviations are documented.
7. `AGENT_PROGRESS.md` and `ROADMAP.md` reflect the current state.
8. Sam explicitly approves the checkpoint.

## 11. Approval Gates

No agent may begin the next checkpoint without Sam's explicit approval of the current checkpoint.

**Current gate:** Checkpoint 2 must be completed, verified, and approved before Checkpoint 3 begins.
