#!/usr/bin/env python3
"""Checkpoint 2 real-browser acceptance suite (Tire Match wizard, Steps 1 and 2).

Runs the 18 required tests plus the attribution tests in headless Chromium at a mobile and a
desktop viewport, against a running preview. Read-only: it never writes to the API or database.

Usage:
    T4T_BASE_URL=https://<preview-host> python3 tests/e2e/checkpoint2_browser.py [--screenshots DIR]

Requires the `playwright` Python package and a Chromium build. Results are printed and written to
test_reports/checkpoint2_browser.json.
"""
import argparse
import gzip
import json
import os
import sys
import traceback
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE = os.environ.get("T4T_BASE_URL", "http://localhost:3000").rstrip("/")
ROOT = Path(__file__).resolve().parents[2]
VIEWPORTS = {
    "mobile": {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True,
               "device_scale_factor": 2},
    "desktop": {"viewport": {"width": 1440, "height": 900}},
}
ATTR_KEY = "t4t.attribution.v1"
CITY_KEY = "t4t.selected_city.v1"
WIZ_KEY = "t4t.tire_match_wizard.v1"
FULL_QUERY = ("city=ottawa&source=partner&campaign=fall&shop=shop-1&package=full&price=quoted"
              "&utm_source=first&utm_medium=email&utm_campaign=launch")
# Distinctive values typed into the form, searched for in every outgoing request.
TYPED_POSTAL = "K1A 0B1"
TYPED_ISSUE = "Slow leak zebra-quartz front tire"
NEED_LABELS = ["Buy 2 tires", "Buy 4 tires", "Winter tire changeover", "Tire repair or inspection",
               "I’m not sure — help me choose"]
RADIUS_LABELS = ["Within 10 km", "Within 25 km", "Within 50 km", "Flexible"]


def tid(name):
    return f'[data-testid="{name}"]'


def api_get(s, path):
    """Read-only API call made by the browser context itself (not recorded as a page request)."""
    response = s.context.request.get(f"{BASE}{path}")
    assert response.ok, f"GET {path} returned {response.status}"
    return response.json()


def record_counts(s):
    """Row counts for leads, quotes and the rest, from the staging-only review endpoint."""
    return api_get(s, "/api/system/architecture")["record_counts"]


class Session:
    """One clean browser context with every network request recorded."""

    def __init__(self, browser, viewport_name):
        self.context = browser.new_context(**VIEWPORTS[viewport_name])
        self.requests = []
        self.context.on("request", self._record)
        self.page = self.context.new_page()
        self.page.set_default_timeout(15000)

    def _record(self, request):
        body = request.post_data_buffer
        text = ""
        if body:
            for decode in (lambda b: gzip.decompress(b).decode("utf-8", "replace"),
                           lambda b: b.decode("utf-8", "replace")):
                try:
                    text = decode(body)
                    break
                except Exception:
                    continue
        self.requests.append({"method": request.method, "url": request.url, "body": text,
                              "body_bytes": len(body) if body else 0})

    def new_tab(self):
        """A new tab: same local storage, fresh session storage (a later visit)."""
        self.page.close()
        self.page = self.context.new_page()
        self.page.set_default_timeout(15000)
        return self.page

    def goto(self, path):
        self.page.goto(f"{BASE}{path}", wait_until="domcontentloaded")
        self.page.wait_for_selector(f'{tid("location-step")}, {tid("need-step")}, {tid("city-hero")}, h1')

    def wizard(self, query=""):
        self.page.goto(f"{BASE}/tire-match{('?' + query) if query else ''}", wait_until="domcontentloaded")
        self.page.wait_for_selector(f'{tid("location-step")}, {tid("need-step")}')

    def store(self, key):
        raw = self.page.evaluate("k => window.localStorage.getItem(k)", key)
        return json.loads(raw) if raw else None

    def original(self):
        record = self.store(ATTR_KEY)
        return record["original"] if record else None

    def to_step_2(self, city="ottawa"):
        self.page.select_option(tid("city-select"), city)
        self.page.click(tid("continue-location"))
        self.page.wait_for_selector(tid("need-step"))

    def app_requests(self):
        host = urlparse(BASE).netloc
        return [r for r in self.requests if urlparse(r["url"]).netloc == host]

    def api_requests(self):
        return [r for r in self.app_requests() if urlparse(r["url"]).path.startswith("/api")]

    def non_api_writes(self):
        """Every non-GET request that is not to the application API, grouped by where it went.

        In the development preview these are tooling and infrastructure, not the application:
        the dev-server error overlay, the preview host's CDN beacons, and the analytics snippet
        that ships in public/index.html. They are reported, never hidden.
        """
        groups = {}
        for r in self.requests:
            parsed = urlparse(r["url"])
            if r["method"] in ("GET", "HEAD", "OPTIONS") or parsed.path.startswith("/api"):
                continue
            segment = "/" + parsed.path.strip("/").split("/")[0]
            where = segment if parsed.netloc == urlparse(BASE).netloc else f"{parsed.netloc}{segment}"
            groups[where] = groups.get(where, 0) + 1
        return groups

    def close(self):
        self.context.close()


def text_of(page, selector):
    return page.inner_text(selector).strip()


def option_labels(page, selector):
    return page.eval_on_selector_all(f"{selector} option", "els => els.map(e => e.textContent.trim())")


def no_horizontal_scroll(page):
    return page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")


# ----------------------------------------------------------------------------- tests

def t01(s, vp):
    s.wizard()
    assert text_of(s.page, tid("step-heading")) == "Which city are you in?"
    assert text_of(s.page, tid("wizard-progress-label")) == "Step 1 of 6"
    for field in ("city-select", "postal-code-input", "travel-radius-select"):
        assert s.page.is_visible(tid(field)), field
    # Database-driven: the dropdown is exactly what the public locations API returned.
    api_names = [c["name"] for c in api_get(s, "/api/public/locations")["cities"]]
    assert sorted(api_names) == ["Hamilton", "Ottawa", "Toronto"], api_names
    assert option_labels(s.page, tid("city-select")) == ["Choose a city"] + api_names
    assert s.page.input_value(tid("city-select")) == "", "no city should be preselected on a clean visit"
    assert s.page.is_disabled(tid("continue-location"))
    return f"cities from API: {api_names}"


def t02(s, vp):
    s.wizard()
    for slug in ("toronto", "hamilton", "ottawa"):
        s.page.select_option(tid("city-select"), slug)
        assert s.page.input_value(tid("city-select")) == slug
        assert s.store(CITY_KEY)["slug"] == slug
    return "all three cities selectable"


def t03(s, vp):
    seen = []
    for slug in ("ottawa", "toronto", "hamilton"):
        s.new_tab()
        s.wizard(f"city={slug}")
        assert s.page.input_value(tid("city-select")) == slug, slug
        seen.append(slug)
    return f"preselected: {seen}"


def t03_unlisted(s, vp):
    s.wizard("city=gatineau")
    assert s.page.input_value(tid("city-select")) == ""
    assert "Gatineau" not in option_labels(s.page, tid("city-select"))
    return "unlisted city in URL is ignored"


def t03_url_beats_saved(s, vp):
    # Original attribution: an organic landing on /toronto.
    s.goto("/toronto")
    original = s.original()
    s.wizard()
    s.page.select_option(tid("city-select"), "toronto")
    s.page.fill(tid("postal-code-input"), "M5V 2T6")
    s.page.click(tid("continue-location"))
    s.page.click(f'{tid("need-option-buy_4")} input')
    assert s.store(WIZ_KEY)["state"]["citySlug"] == "toronto"
    # A later visit arrives with ?city=ottawa.
    s.new_tab()
    s.wizard("city=ottawa")
    assert s.page.input_value(tid("city-select")) == "ottawa"
    assert text_of(s.page, tid("wizard-progress-label")) == "Step 1 of 6"
    saved = s.store(WIZ_KEY)["state"]
    assert saved["citySlug"] == "ottawa" and saved["postalCode"] == "M5V 2T6" and saved["need"] == "buy_4"
    assert s.store(CITY_KEY)["slug"] == "ottawa"
    assert s.original() == original, "original attribution changed"
    assert s.original()["city"] is None and "/toronto" in s.original()["landing_url"]
    return "saved Toronto + ?city=ottawa -> Ottawa; original attribution unchanged"


def t04(s, vp):
    s.wizard()
    s.page.select_option(tid("city-select"), "ottawa")
    assert s.page.input_value(tid("postal-code-input")) == ""
    assert not s.page.is_disabled(tid("continue-location"))
    s.page.click(tid("continue-location"))
    s.page.wait_for_selector(tid("need-step"))
    return "continued with postal code empty"


def t05(s, vp):
    s.wizard()
    assert option_labels(s.page, tid("travel-radius-select")) == ["Choose a travel radius"] + RADIUS_LABELS
    for value in ("10", "25", "50", "flexible"):
        s.page.select_option(tid("travel-radius-select"), value)
        assert s.page.input_value(tid("travel-radius-select")) == value
    s.page.select_option(tid("city-select"), "ottawa")
    s.page.select_option(tid("travel-radius-select"), "")
    assert not s.page.is_disabled(tid("continue-location")), "radius must be optional"
    return "four radius options, optional"


def t06(s, vp):
    s.wizard()
    s.to_step_2()
    assert text_of(s.page, tid("step-heading")) == "What do you need today?"
    assert text_of(s.page, tid("wizard-progress-label")) == "Step 2 of 6"
    return "Step 2 heading and label correct"


def t07(s, vp):
    s.wizard()
    s.to_step_2()
    labels = [text_of(s.page, tid(f"need-option-{v}")) for v in ("buy_2", "buy_4", "changeover", "repair", "unsure")]
    assert labels == NEED_LABELS, labels
    assert s.page.locator(f'{tid("need-step")} input[name="tire-need"]').count() == 5
    for value in ("buy_2", "buy_4", "unsure"):
        s.page.click(f'{tid(f"need-option-{value}")} input')
        assert s.page.locator('input[name="tire-need"]:checked').count() == 1, "must be single-select"
        assert s.page.is_checked(f'{tid(f"need-option-{value}")} input')
    s.page.click(f'{tid("need-option-changeover")} input')
    assert s.page.is_visible(tid("winter-question"))
    s.page.click(tid("change-need"))
    s.page.click(f'{tid("need-option-repair")} input')
    assert s.page.is_visible(tid("issue-description"))
    return "five single-select options with exact labels"


def t08(s, vp):
    s.wizard()
    s.to_step_2()
    page = s.page
    outcomes = {}

    def finish(label):
        page.click(tid("continue-need"))
        page.wait_for_selector(tid("next-step-notice"))
        outcomes[label] = page.get_attribute(tid("next-step-notice"), "data-outcome")
        notice = text_of(page, tid("next-step-notice"))
        page.click(tid("edit-need"))
        return notice

    for value in ("buy_2", "buy_4"):
        page.click(f'{tid(f"need-option-{value}")} input')
        assert "Next: vehicle and tire size (coming soon)." in finish(value)
    page.click(f'{tid("need-option-unsure")} input')
    finish("unsure")

    page.click(f'{tid("need-option-changeover")} input')
    assert page.is_disabled(tid("continue-need")), "changeover needs the new-tires answer first"
    page.click(f'{tid("winter-new-tires-yes")} input')
    finish("changeover_yes")
    page.click(f'{tid("winter-new-tires-no")} input')
    finish("changeover_no")
    page.click(tid("change-need"))

    page.click(f'{tid("need-option-repair")} input')
    assert page.is_disabled(tid("continue-need")), "repair needs a short description first"
    page.fill(tid("issue-description"), "Slow leak")
    finish("repair")

    expected = {"buy_2": "vehicle_tire_size", "buy_4": "vehicle_tire_size", "unsure": "guidance_needed",
                "changeover_yes": "vehicle_tire_size", "changeover_no": "changeover_request",
                "repair": "repair_inspection"}
    assert outcomes == expected, outcomes
    body = page.inner_text("body").lower()
    for banned in ("checkpoint", "not implemented", "todo", "not built"):
        assert banned not in body, banned
    # No later step was built: there is no step 3 screen to reach.
    assert page.locator(tid("wizard-progress-label")).inner_text() == "Step 2 of 6"
    return json.dumps(outcomes)


def t09(s, vp):
    s.wizard()
    page = s.page
    page.select_option(tid("city-select"), "ottawa")
    page.fill(tid("postal-code-input"), TYPED_POSTAL)
    page.select_option(tid("travel-radius-select"), "25")
    page.click(tid("continue-location"))
    page.click(f'{tid("need-option-buy_4")} input')
    page.click(tid("wizard-back"))
    assert page.input_value(tid("city-select")) == "ottawa"
    assert page.input_value(tid("postal-code-input")) == TYPED_POSTAL
    assert page.input_value(tid("travel-radius-select")) == "25"
    page.click(tid("continue-location"))
    assert page.is_checked(f'{tid("need-option-buy_4")} input')
    return "selections kept both ways"


def t10(s, vp):
    s.wizard()
    bar = '[role="progressbar"]'
    assert text_of(s.page, tid("wizard-progress-label")) == "Step 1 of 6"
    assert s.page.get_attribute(bar, "aria-valuenow") == "1"
    s.to_step_2()
    assert text_of(s.page, tid("wizard-progress-label")) == "Step 2 of 6"
    assert s.page.get_attribute(bar, "aria-valuenow") == "2"
    s.page.click(tid("wizard-back"))
    assert text_of(s.page, tid("wizard-progress-label")) == "Step 1 of 6"
    return "1 of 6 -> 2 of 6 -> 1 of 6"


def t11(s, vp):
    s.wizard()
    s.page.select_option(tid("city-select"), "hamilton")
    s.page.fill(tid("postal-code-input"), "L8P 1A1")
    s.page.select_option(tid("travel-radius-select"), "50")
    saved = s.store(WIZ_KEY)["state"]
    assert saved["step"] == 1 and saved["citySlug"] == "hamilton", "partial progress must be saved before Continue"
    s.page.click(tid("continue-location"))
    s.page.click(f'{tid("need-option-changeover")} input')
    saved = s.store(WIZ_KEY)["state"]
    assert (saved["step"], saved["citySlug"], saved["postalCode"], saved["radius"], saved["need"]) == \
        (2, "hamilton", "L8P 1A1", "50", "changeover"), saved
    return f"saved under {WIZ_KEY}"


def t12(s, vp):
    page = s.page
    width = VIEWPORTS[vp]["viewport"]["width"]
    s.wizard()
    notes = []
    for step in (1, 2):
        if step == 2:
            s.to_step_2()
        assert page.evaluate("window.innerWidth") == width
        assert no_horizontal_scroll(page), f"horizontal scroll on step {step}"
        controls = page.locator(f'{tid("tire-match-page")} select, {tid("tire-match-page")} input:not([type=radio]), '
                                f'{tid("tire-match-page")} textarea, {tid("tire-match-page")} button, '
                                f'{tid("tire-match-page")} label[data-testid^="need-option-"]')
        for i in range(controls.count()):
            box = controls.nth(i).bounding_box()
            if not box:
                continue
            assert box["x"] >= 0 and box["x"] + box["width"] <= width + 0.5, f"control overflows on step {step}"
            assert box["height"] >= 40, f"tap target {box['height']}px on step {step}"
        fields = page.locator(f'{tid("tire-match-page")} select, {tid("tire-match-page")} input, '
                              f'{tid("tire-match-page")} textarea')
        assert fields.count() <= 6, f"{fields.count()} fields/choices on step {step}"
        notes.append(f"step {step}: {fields.count()} fields")
    # Step 2 primary action: full width on a phone, compact on a desktop.
    page.click(f'{tid("need-option-buy_4")} input')
    button = page.locator(tid("continue-need")).bounding_box()
    card = page.locator(tid("need-step")).bounding_box()
    ratio = button["width"] / card["width"]
    if vp == "mobile":
        assert ratio > 0.95, f"primary action is {ratio:.0%} of the form width"
        font = page.eval_on_selector(tid("change-need") if page.is_visible(tid("change-need")) else "body",
                                     "e => parseFloat(getComputedStyle(e).fontSize)")
        s.page.click(tid("wizard-back"))
        size = page.eval_on_selector(tid("postal-code-input"), "e => parseFloat(getComputedStyle(e).fontSize)")
        assert size >= 16, f"input text is {size}px; under 16px makes phones zoom"
        assert font > 0
    else:
        assert ratio < 0.5, f"primary action is {ratio:.0%} of the form width"
    notes.append(f"primary action {ratio:.0%} of form width; no horizontal scroll at {width}px")
    return "; ".join(notes)


def t13(s, vp):
    s.wizard()
    page = s.page
    page.select_option(tid("city-select"), "toronto")
    page.fill(tid("postal-code-input"), "M5V 2T6")
    page.select_option(tid("travel-radius-select"), "flexible")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_selector(tid("location-step"))
    assert page.input_value(tid("city-select")) == "toronto"
    assert page.input_value(tid("postal-code-input")) == "M5V 2T6"
    assert page.input_value(tid("travel-radius-select")) == "flexible"
    page.click(tid("continue-location"))
    page.click(f'{tid("need-option-repair")} input')
    page.fill(tid("issue-description"), "Nail in rear tire")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_selector(tid("need-step"))
    assert text_of(page, tid("wizard-progress-label")) == "Step 2 of 6"
    assert page.input_value(tid("issue-description")) == "Nail in rear tire"
    # A URL preselect followed by a manual change also survives refresh.
    s.new_tab()
    s.wizard("city=ottawa")
    s.page.select_option(tid("city-select"), "hamilton")
    s.page.reload(wait_until="domcontentloaded")
    s.page.wait_for_selector(tid("location-step"))
    assert s.page.input_value(tid("city-select")) == "hamilton"
    return "step 1, step 2 and a manual change after ?city= all survive refresh"


def t14(s, vp):
    s.wizard()
    page = s.page
    banned = ('input[type="email"], input[type="tel"], input[type="password"], [name*="email" i], [name*="phone" i], '
              '[name*="name" i]:not([name="tire-need"]), [autocomplete*="email"], [autocomplete*="tel"], '
              '[autocomplete*="name"], [id*="email" i], [id*="phone" i]')
    found = {}
    for step in (1, 2):
        if step == 2:
            s.to_step_2()
            page.click(f'{tid("need-option-repair")} input')
        assert page.locator(f'{tid("tire-match-page")} {banned}').count() == 0, f"contact field on step {step}"
        labels = page.eval_on_selector_all(f'{tid("tire-match-page")} label', "els => els.map(e => e.textContent)")
        for label in labels:
            lowered = label.lower()
            assert not any(word in lowered for word in ("email", "phone", "your name", "first name", "last name")), label
        found[step] = page.eval_on_selector_all(
            f'{tid("tire-match-page")} select, {tid("tire-match-page")} input:not([type=radio]), '
            f'{tid("tire-match-page")} textarea', "els => els.map(e => e.id)")
    return f"fields present: {found}"


def t15(s, vp):
    before = record_counts(s)
    s.wizard("city=ottawa&utm_source=first")
    run_full_wizard(s)
    after = record_counts(s)
    assert before == after, f"record counts changed: {before} -> {after}"
    assert after["leads"] == 0 and after["quotes"] == 0
    for request in s.requests:
        path = urlparse(request["url"]).path.lower()
        if urlparse(request["url"]).netloc == urlparse(BASE).netloc:
            assert "lead" not in path and "quote" not in path and "interest" not in path, request["url"]
    keys = sorted(k for k in s.page.evaluate("Object.keys(window.localStorage)") if k.startswith("t4t."))
    assert keys == sorted([ATTR_KEY, CITY_KEY, WIZ_KEY]), keys
    return f"leads={after['leads']}, quotes={after['quotes']} before and after; no lead endpoint called"


def run_full_wizard(s):
    page = s.page
    page.select_option(tid("city-select"), "ottawa")
    page.fill(tid("postal-code-input"), TYPED_POSTAL)
    page.select_option(tid("travel-radius-select"), "25")
    page.click(tid("continue-location"))
    page.click(f'{tid("need-option-repair")} input')
    page.fill(tid("issue-description"), TYPED_ISSUE)
    page.click(tid("continue-need"))
    page.wait_for_selector(tid("next-step-notice"))
    page.click(tid("edit-need"))
    page.click(tid("wizard-back"))
    page.select_option(tid("city-select"), "toronto")
    page.click(tid("continue-location"))
    page.wait_for_timeout(2500)  # allow any deferred or batched request to leave the browser


def t16(s, vp):
    s.wizard()
    run_full_wizard(s)
    s.page.wait_for_timeout(5000)  # analytics batches leave on a timer; wait for them too
    api = s.api_requests()
    assert api, "expected the two read-only API calls"
    api_writes = [r for r in api if r["method"] not in ("GET", "HEAD", "OPTIONS")]
    assert not api_writes, f"write to the application API: {[(r['method'], r['url']) for r in api_writes]}"
    paths = sorted({urlparse(r["url"]).path for r in api})
    assert paths == ["/api/public/config", "/api/public/locations"], paths
    assert all(not r["body_bytes"] for r in api), "an API request carried a body"
    # Nothing the driver typed may leave the browser, to any host, in a URL or a body.
    leaked = sorted({urlparse(r["url"]).netloc + urlparse(r["url"]).path for r in s.requests
                     if any(v in r["body"] or v in r["url"] for v in (TYPED_POSTAL, "zebra-quartz", "K1A%200B1", "K1A+0B1"))})
    s.findings = {"non_api_writes_by_destination": s.non_api_writes(), "typed_values_found_in": leaked}
    assert not leaked, f"typed wizard values left the browser: {leaked}"
    return (f"API calls: {paths}, GET only, no body; typed values found in 0 of {len(s.requests)} requests; "
            f"non-API writes (preview tooling/analytics): {s.findings['non_api_writes_by_destination']}")


def t17(s, vp):
    s.goto(f"/ottawa?{FULL_QUERY}")
    original = s.original()
    assert original["city"] == "ottawa" and original["utm_source"] == "first" and original["shop"] == "shop-1"
    assert "/ottawa" in original["landing_url"]
    s.wizard(FULL_QUERY)
    assert s.page.input_value(tid("city-select")) == "ottawa"
    s.page.select_option(tid("city-select"), "toronto")
    s.page.click(tid("continue-location"))
    s.page.click(f'{tid("need-option-buy_2")} input')
    s.page.click(tid("continue-need"))
    assert s.original() == original, "original attribution changed when the city changed"
    assert s.store(CITY_KEY)["slug"] == "toronto"
    assert s.store(WIZ_KEY)["state"]["citySlug"] == "toronto"
    assert s.original()["city"] == "ottawa"
    missing = [k for k in ("city", "source", "campaign", "shop", "package", "price", "utm_source", "utm_medium",
                           "utm_campaign", "landing_url") if not s.original().get(k)]
    assert not missing, missing
    return "all 9 URL fields + landing URL intact; selected city toronto stored separately from landing city ottawa"


def set_captured_days_ago(s, days):
    stamp = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat().replace("+00:00", "Z")
    s.page.evaluate(
        """([key, stamp]) => { const r = JSON.parse(localStorage.getItem(key)); r.original_meta.captured_at = stamp;
            localStorage.setItem(key, JSON.stringify(r)); }""", [ATTR_KEY, stamp])


def t18(s, vp):
    s.goto(f"/ottawa?{FULL_QUERY}")
    original = s.original()
    # A later touch the same day.
    s.wizard("city=toronto&utm_source=second&shop=shop-2&price=other")
    assert s.original() == original
    assert s.store(ATTR_KEY)["last_touch"]["utm_source"] == "second"
    # A later touch on day 29: still locked.
    set_captured_days_ago(s, 29)
    s.wizard("city=hamilton&utm_source=third")
    assert s.original() == original, "original changed inside the 30-day lock"
    assert s.store(ATTR_KEY)["last_touch"]["utm_source"] == "third"
    return "later touches on day 0 and day 29 recorded as last touch only; original unchanged"


def a1_organic_first(s, vp):
    s.goto("/")
    original = s.original()
    assert original["city"] is None and original["utm_source"] is None
    set_captured_days_ago(s, 29)
    s.goto("/toronto?city=toronto&utm_source=followup&shop=shop-2")
    assert s.original() == original
    assert s.store(ATTR_KEY)["last_touch"]["utm_source"] == "followup"
    return "organic first landing stays the original for 30 days"


def a2_expiry(s, vp):
    s.goto("/ottawa?city=ottawa&utm_source=first")
    set_captured_days_ago(s, 31)
    s.goto("/toronto?city=toronto&utm_source=second")
    assert s.original()["city"] == "toronto" and s.original()["utm_source"] == "second"
    assert s.store(ATTR_KEY)["last_touch"] is None
    return "after 31 days a new original touch starts"


def a3_internal_navigation(s, vp):
    s.goto(f"/ottawa?{FULL_QUERY}")
    original = s.original()
    s.page.click(tid("city-selector-trigger"))
    s.page.wait_for_selector('[role="dialog"]')
    s.page.locator('[role="dialog"] [role="option"]', has_text="Toronto").first.click()
    s.page.wait_for_url("**/toronto**")
    assert s.original() == original
    assert s.store(CITY_KEY)["slug"] == "toronto"
    s.wizard(FULL_QUERY)
    # The driver explicitly chose Toronto, so the carried ?city=ottawa does not override it.
    assert s.page.input_value(tid("city-select")) == "toronto"
    assert s.original() == original
    return "city selector change keeps attribution; explicit choice outranks carried parameter"


TESTS = [
    ("1", "Step 1 loads correctly", t01),
    ("2", "City can be selected manually", t02),
    ("3", "City is preselected from URL", t03),
    ("3a", "Unlisted URL city is ignored", t03_unlisted),
    ("3b", "URL city wins over saved progress; attribution unchanged", t03_url_beats_saved),
    ("4", "Postal code is optional", t04),
    ("5", "Travel radius can be selected", t05),
    ("6", "Step 2 loads correctly", t06),
    ("7", "All five need options work", t07),
    ("8", "Each need type routes to the correct next step", t08),
    ("9", "Forward and backward navigation preserves selections", t09),
    ("10", "Progress indicator updates correctly", t10),
    ("11", "Partial progress is saved in local storage", t11),
    ("12", "Form works on this viewport (measured layout)", t12),
    ("13", "No data is lost on refresh", t13),
    ("14", "No customer contact information is collected", t14),
    ("15", "No lead is created", t15),
    ("16", "No server write occurs", t16),
    ("17", "Attribution remains intact when city changes", t17),
    ("18", "Original attribution remains locked for 30 days", t18),
    ("A1", "Attribution: organic first landing is the original", a1_organic_first),
    ("A2", "Attribution: lock ends after 30 days", a2_expiry),
    ("A3", "Attribution: city selector keeps attribution", a3_internal_navigation),
]


def take_screenshots(browser, directory):
    directory.mkdir(parents=True, exist_ok=True)

    def shot(s, vp, name):
        # Grow the window to the page height instead of a stitched full-page capture, which
        # would draw the sticky header across the middle of the image.
        width = VIEWPORTS[vp]["viewport"]["width"]
        height = s.page.evaluate("document.documentElement.scrollHeight")
        s.page.set_viewport_size({"width": width, "height": height})
        s.page.evaluate("window.scrollTo(0, 0)")
        s.page.wait_for_timeout(300)
        s.page.screenshot(path=str(directory / f"checkpoint-2-{name}-{vp}.jpg"), type="jpeg", quality=70)
        s.page.set_viewport_size(VIEWPORTS[vp]["viewport"])

    for vp in VIEWPORTS:
        s = Session(browser, vp)
        s.wizard("city=ottawa")
        s.page.fill(tid("postal-code-input"), TYPED_POSTAL)
        s.page.select_option(tid("travel-radius-select"), "25")
        s.page.locator(tid("step-heading")).click()  # move focus off the field
        shot(s, vp, "step-1")
        s.page.click(tid("continue-location"))
        s.page.click(f'{tid("need-option-buy_4")} input')
        shot(s, vp, "step-2")
        s.page.click(tid("continue-need"))
        s.page.wait_for_selector(tid("next-step-notice"))
        shot(s, vp, "step-2-next")
        s.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--screenshots", help="directory to write Step 1 and Step 2 screenshots to")
    parser.add_argument("--screenshots-only", action="store_true", help="skip the tests; only capture screenshots")
    args = parser.parse_args()
    tests = [] if args.screenshots_only else TESTS

    results, findings = [], {}
    with sync_playwright() as p:
        launch = {}
        if os.environ.get("PLAYWRIGHT_CHROME_EXECUTABLE_PATH"):
            launch["executable_path"] = os.environ["PLAYWRIGHT_CHROME_EXECUTABLE_PATH"]
        browser = p.chromium.launch(**launch)
        for vp in VIEWPORTS:
            for number, title, fn in tests:
                s = Session(browser, vp)
                try:
                    detail = fn(s, vp)
                    status = "PASS"
                except Exception as exc:  # report every failure; never stop at the first
                    status = "FAIL"
                    detail = f"{type(exc).__name__}: {exc}".splitlines()[0][:400]
                    if os.environ.get("T4T_E2E_DEBUG"):
                        traceback.print_exc()
                if getattr(s, "findings", None):
                    findings[vp] = s.findings
                s.close()
                results.append({"viewport": vp, "test": number, "title": title, "status": status, "detail": detail})
                print(f"[{vp:7}] {status}  {number:>3}. {title} — {detail}")
        if args.screenshots:
            take_screenshots(browser, Path(args.screenshots))
        browser.close()

    if args.screenshots_only:
        return
    passed = sum(r["status"] == "PASS" for r in results)
    summary = {
        "suite": "Checkpoint 2 real-browser acceptance",
        "run_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        "base_url_host": urlparse(BASE).netloc,
        "viewports": {k: v["viewport"] for k, v in VIEWPORTS.items()},
        "passed": passed, "failed": len(results) - passed, "total": len(results),
        "network_findings": findings, "results": results,
    }
    report = ROOT / "test_reports" / "checkpoint2_browser.json"
    report.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n")
    print(f"\n{passed} of {len(results)} passed. Report: {report.relative_to(ROOT)}")
    print("Network findings:", json.dumps(findings))
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
