#!/usr/bin/env python3
"""Checkpoint 2 review evidence: screenshots of the required city-precedence cases at 390x844 and
1440x900, plus a full recording of every network request made while a driver uses the wizard.

Read-only. Changes no application file and writes nothing to the API or database.
Usage: T4T_BASE_URL=<url> python3 evidence.py <label> <output-dir>
"""
import gzip
import html
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE = os.environ["T4T_BASE_URL"].rstrip("/")
LABEL, OUT = sys.argv[1], Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
HOST = urlparse(BASE).netloc
VIEWPORTS = {
    "390x844": {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True},
    "1440x900": {"viewport": {"width": 1440, "height": 900}},
}
TYPED = ["K1A 0B1", "K1A%200B1", "K1A+0B1", "zebra-quartz"]
WIZ_KEY = "t4t.tire_match_wizard.v1"


def tid(name):
    return f'[data-testid="{name}"]'


def decode(body):
    if not body:
        return ""
    for fn in (lambda b: gzip.decompress(b).decode("utf-8", "replace"), lambda b: b.decode("utf-8", "replace")):
        try:
            return fn(body)
        except Exception:
            continue
    return ""


def classify(url):
    p = urlparse(url)
    low = url.lower()
    if "posthog" in low or "ap.emergent.sh" in low:
        return "POSTHOG"
    if "emergent.sh" in low or "emergent-main" in low:
        return "EMERGENT ANALYTICS HOST"
    if p.netloc in ("fonts.googleapis.com", "fonts.gstatic.com"):
        return "Google Fonts (font asset)"
    if p.netloc == "static.cloudflareinsights.com" or p.path.startswith("/cdn-cgi/"):
        return "Cloudflare beacon (added by preview host)"
    if p.netloc == HOST and p.path.startswith("/__emergent_overlay__"):
        return "Dev-server overlay/recorder (added by workspace dev server)"
    if p.netloc == HOST and p.path.startswith("/visual-edit"):
        return "Dev-server visual-edit tooling"
    if p.netloc == HOST and p.path.startswith("/api"):
        return "Application API"
    if p.netloc == HOST or p.scheme in ("data", "blob"):
        return "Application asset"
    if p.scheme in ("ws", "wss"):
        return "Dev-server websocket"
    return "OTHER THIRD PARTY"


def run(browser, vp):
    ctx = browser.new_context(**VIEWPORTS[vp])
    reqs = []

    def on_request(r):
        body = r.post_data_buffer
        text = decode(body)
        reqs.append({"method": r.method, "url": r.url, "resource": r.resource_type,
                     "class": classify(r.url), "body_bytes": len(body) if body else 0,
                     "typed_value_in_request": any(v in text or v in r.url for v in TYPED),
                     "body_excerpt": text[:600]})

    ctx.on("request", on_request)
    ws = []
    page = ctx.new_page()
    page.on("websocket", lambda w: ws.append(w.url))
    page.set_default_timeout(20000)
    shots = []

    def shot(name, note):
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(400)
        f = f"{name}-{vp}.jpg"
        page.screenshot(path=str(OUT / f), type="jpeg", quality=60, full_page=False)
        state = {
            "city_select_value": page.input_value(tid("city-select")) if page.locator(tid("city-select")).count() else None,
            "step_label": page.inner_text(tid("wizard-progress-label")),
            "continue_disabled": page.is_disabled(tid("continue-location")) if page.locator(tid("continue-location")).count() else None,
            "saved_wizard_state": json.loads(page.evaluate("k => localStorage.getItem(k)", WIZ_KEY) or "null"),
        }
        shots.append({"file": f, "case": note, "url": page.url.replace(BASE, ""), "observed": state})

    def wizard(query=""):
        page.goto(f"{BASE}/tire-match{('?' + query) if query else ''}", wait_until="domcontentloaded")
        page.wait_for_selector(f'{tid("location-step")}, {tid("need-step")}')

    # Case 1: no URL city, no saved progress.
    wizard()
    shot("1-no-url-no-saved", "No URL city and no saved progress")
    # Case 2: URL city preselected.
    wizard("city=ottawa")
    shot("2-url-city-preselected", "URL ?city=ottawa preselects Ottawa")
    # Case 3: manual change after URL preselect.
    page.select_option(tid("city-select"), "hamilton")
    shot("3-manual-change-after-url", "Manual change to Hamilton after ?city=ottawa")
    # Case 4: refresh keeps the manual change (URL still says ottawa).
    page.reload(wait_until="domcontentloaded")
    page.wait_for_selector(tid("location-step"))
    shot("4-refresh-keeps-manual-change", "Refresh with ?city=ottawa still in the URL keeps Hamilton")
    # Typed input, Step 2, to exercise every request the wizard can make.
    page.fill(tid("postal-code-input"), "K1A 0B1")
    page.select_option(tid("travel-radius-select"), "25")
    page.click(tid("continue-location"))
    page.click(f'{tid("need-option-repair")} input')
    page.fill(tid("issue-description"), "Slow leak zebra-quartz front tire")
    page.click(tid("continue-need"))
    page.wait_for_selector(tid("next-step-notice"))
    page.click(tid("edit-need"))
    shot("5a-saved-hamilton-on-step-2", "Saved progress: Hamilton, on Step 2, other answers filled in")
    # Case 5: a later visit (new tab = new browser session) arrives with a different URL city.
    page.close()
    page = ctx.new_page()
    page.on("websocket", lambda w: ws.append(w.url))
    page.set_default_timeout(20000)
    wizard("city=toronto")
    shot("5b-url-city-replaces-saved-returns-to-step-1",
         "New session with ?city=toronto replaces saved Hamilton: back on Step 1, other answers kept")
    page.wait_for_timeout(7000)  # let any deferred, batched or beacon request leave the browser
    info = {
        "analytics_globals": page.evaluate(
            "['posthog','gtag','ga','dataLayer','mixpanel','analytics','hj','clarity','FS'].filter(k => k in window)"),
        "recorder_globals": page.evaluate(
            "Object.keys(window).filter(k => /rrweb|emergent/i.test(k))"),
        "script_tags": page.eval_on_selector_all("script", "els => els.map(e => e.src || '(inline, ' + e.textContent.length + ' chars)')"),
        "cookies": [{"name": c["name"], "domain": c["domain"]} for c in ctx.cookies()],
        "websockets": sorted(set(ws)),
    }
    ctx.close()
    return reqs, shots, info


def render(browser, vp, reqs, info):
    """Render the recorded request log as a page and photograph it (headless browsers have no DevTools tab)."""
    groups = {}
    for r in reqs:
        p = urlparse(r["url"])
        key = (r["class"], r["method"], p.netloc or p.scheme, p.path[:70])
        g = groups.setdefault(key, {"n": 0, "bytes": 0, "typed": False})
        g["n"] += 1
        g["bytes"] += r["body_bytes"]
        g["typed"] = g["typed"] or r["typed_value_in_request"]
    rows = "".join(
        f"<tr><td>{html.escape(k[0])}</td><td>{k[1]}</td><td>{html.escape(k[2])}</td><td>{html.escape(k[3])}</td>"
        f"<td>{g['n']}</td><td>{g['bytes']}</td><td>{'YES' if g['typed'] else 'no'}</td></tr>"
        for k, g in sorted(groups.items()))
    count = lambda c: sum(r["class"] == c for r in reqs)
    summary = (f"PostHog requests: {count('POSTHOG')} &nbsp;|&nbsp; emergent.sh requests: {count('EMERGENT ANALYTICS HOST')}"
               f" &nbsp;|&nbsp; other third party: {count('OTHER THIRD PARTY')}"
               f" &nbsp;|&nbsp; requests containing typed wizard input: {sum(r['typed_value_in_request'] for r in reqs)}")
    doc = (f"<html><body style='font:13px/1.35 Arial;margin:16px;background:#fff;color:#111'>"
           f"<h2 style='margin:0 0 4px'>Recorded network requests — {html.escape(LABEL)} — viewport {vp}</h2>"
           f"<div>Target: {html.escape(BASE)} &nbsp; Total requests: {len(reqs)}. This is a rendering of the request log "
           f"recorded by the test browser, not the DevTools panel.</div>"
           f"<div style='margin:8px 0;padding:8px;background:#eef;border:1px solid #99c'><b>{summary}</b></div>"
           f"<table border='1' cellspacing='0' cellpadding='4' style='border-collapse:collapse;font-size:12px'>"
           f"<tr style='background:#ddd'><th>Class</th><th>Method</th><th>Host</th><th>Path</th><th>Count</th>"
           f"<th>Body bytes</th><th>Typed input inside</th></tr>{rows}</table>"
           f"<div style='margin-top:8px'>Analytics globals on window: {info['analytics_globals'] or 'none'} &nbsp;|&nbsp; "
           f"Cookies: {[c['name'] for c in info['cookies']] or 'none'}</div></body></html>")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.set_content(doc)
    page.screenshot(path=str(OUT / f"network-log-{LABEL}-{vp}.jpg"), type="jpeg", quality=60, full_page=True)
    page.close()


with sync_playwright() as p:
    browser = p.chromium.launch(**({"executable_path": os.environ["PLAYWRIGHT_CHROME_EXECUTABLE_PATH"]} if os.environ.get("PLAYWRIGHT_CHROME_EXECUTABLE_PATH") else {}))
    report = {"label": LABEL, "target": BASE, "viewports": {}}
    for vp in VIEWPORTS:
        reqs, shots, info = run(browser, vp)
        render(browser, vp, reqs, info)
        by_class = {}
        for r in reqs:
            by_class[r["class"]] = by_class.get(r["class"], 0) + 1
        report["viewports"][vp] = {
            "total_requests": len(reqs), "requests_by_class": by_class,
            "non_get_requests": [{k: r[k] for k in ("method", "url", "class", "body_bytes", "typed_value_in_request",
                                                    "body_excerpt")} for r in reqs if r["method"] not in ("GET", "HEAD", "OPTIONS")],
            "requests_containing_typed_input": [r["url"] for r in reqs if r["typed_value_in_request"]],
            "third_party_urls": sorted({r["url"][:160] for r in reqs if urlparse(r["url"]).netloc not in ("", HOST)}),
            "page": info, "screenshots": shots,
            "all_requests": [{k: r[k] for k in ("method", "url", "resource", "class", "body_bytes")} for r in reqs],
        }
        print(vp, json.dumps(by_class))
        for s in shots:
            print("  ", s["file"], "|", s["observed"]["step_label"], "| city =", repr(s["observed"]["city_select_value"]),
                  "| continue disabled =", s["observed"]["continue_disabled"])
    browser.close()
    (OUT / f"network-{LABEL}.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
