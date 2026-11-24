#!/usr/bin/env python3
"""Checkpoint 2 closeout: Referer and attribution check on the review preview.

Synthetic values only. No workspace secret is read, used or compared.

A driver lands with synthetic attribution parameters, moves between pages, completes wizard Steps 1
and 2 with synthetic typed input, and waits for timed messages to leave the browser. Request headers
are taken from the browser's own network layer (Chrome DevTools Protocol, "ExtraInfo" events), which
reports the headers actually put on the wire, including Referer.

Read-only. Usage: T4T_BASE_URL=<url> python3 referrer_check.py <label> <output-dir>
"""
import gzip
import html
import json
import os
import re
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
# Synthetic attribution values: distinctive strings that exist nowhere else.
QUERY = ("city=ottawa&source=synsrc-q7&campaign=syncamp-q7&shop=synshop-q7&package=synpkg-q7&price=synprice-q7"
         "&utm_source=synutm-src-q7&utm_medium=synutm-med-q7&utm_campaign=synutm-cmp-q7")
ATTRIBUTION = ["synsrc-q7", "syncamp-q7", "synshop-q7", "synpkg-q7", "synprice-q7", "synutm-src-q7",
               "synutm-med-q7", "synutm-cmp-q7", "utm_source", "utm_medium", "utm_campaign"]
# Synthetic wizard input.
POSTAL, ISSUE = "K9Z 9Z9", "Synthetic issue plum-walrus-41"
WIZARD_INPUT = ["K9Z 9Z9", "K9Z%209Z9", "K9Z+9Z9", "plum-walrus-41"]
# A synthetic stand-in for a secret, planted in browser storage to prove storage contents are not sent.
SYNTHETIC_SECRET = "synthetic-secret-zz-51f0a9"
ATTR_KEY, WIZ_KEY = "t4t.attribution.v1", "t4t.tire_match_wizard.v1"


def tid(name):
    return f'[data-testid="{name}"]'


def decode(raw):
    if not raw:
        return ""
    for fn in (lambda b: gzip.decompress(b).decode("utf-8", "replace"), lambda b: b.decode("utf-8", "replace")):
        try:
            return fn(raw)
        except Exception:
            continue
    return ""


def group(url):
    p = urlparse(url)
    if p.netloc in ("fonts.googleapis.com", "fonts.gstatic.com"):
        return "4 Fonts (Google Fonts)"
    if p.netloc == "static.cloudflareinsights.com" or (p.netloc == HOST and p.path.startswith("/cdn-cgi/")):
        return "3 Preview host (Cloudflare)"
    if p.netloc == HOST and p.path.startswith(("/__emergent_overlay__", "/visual-edit")):
        return "2 Development overlay"
    if p.netloc == HOST or p.scheme in ("data", "blob"):
        return "1 Application"
    return "5 OTHER"


def found(needles, *texts):
    return sorted({n for n in needles for t in texts if t and n in t})


def run(browser, vp):
    ctx = browser.new_context(**VIEWPORTS[vp])
    page = ctx.new_page()
    page.set_default_timeout(20000)
    cdp = ctx.new_cdp_session(page)
    cdp.send("Network.enable")
    sent, wire = {}, {}
    cdp.on("Network.requestWillBeSent", lambda e: sent.__setitem__(e["requestId"], e["request"]))
    cdp.on("Network.requestWillBeSentExtraInfo", lambda e: wire.setdefault(e["requestId"], {}).update(
        {k.lower(): v for k, v in e.get("headers", {}).items()}))
    bodies = {}
    ctx.on("request", lambda r: bodies.setdefault((r.method, r.url), []).append(decode(r.post_data_buffer)))
    document_policies = {}
    page.on("response", lambda r: document_policies.__setitem__(urlparse(r.url).path, r.headers.get("referrer-policy"))
            if r.request.resource_type == "document" else None)
    checks = {}

    # 1. Landing with attribution in the address: it must be captured.
    page.goto(f"{BASE}/ottawa?{QUERY}", wait_until="domcontentloaded")
    page.wait_for_selector("h1")
    page.evaluate("([k, v]) => localStorage.setItem(k, v)", ["t4t.synthetic_check", SYNTHETIC_SECRET])
    record = json.loads(page.evaluate("k => localStorage.getItem(k)", ATTR_KEY))
    original = record["original"]
    checks["attribution_captured_on_landing"] = (
        original.get("source") == "synsrc-q7" and original.get("utm_campaign") == "synutm-cmp-q7"
        and original.get("shop") == "synshop-q7" and "/ottawa" in (original.get("landing_url") or ""))
    # 2. In-app navigation, then a full page load of the wizard without the parameters, then a reload.
    page.click(tid("city-selector-trigger"))
    page.wait_for_selector('[role="dialog"]')
    page.locator('[role="dialog"] [role="option"]', has_text="Toronto").first.click()
    page.wait_for_url("**/toronto**")
    page.goto(f"{BASE}/tire-match", wait_until="domcontentloaded")
    page.wait_for_selector(tid("location-step"))
    page.reload(wait_until="domcontentloaded")
    page.wait_for_selector(tid("location-step"))
    checks["attribution_survives_navigation_and_reload"] = (
        json.loads(page.evaluate("k => localStorage.getItem(k)", ATTR_KEY))["original"] == original)
    # 3. Wizard Steps 1 and 2 with synthetic typed input, arriving again with the parameters.
    page.goto(f"{BASE}/tire-match?{QUERY}", wait_until="domcontentloaded")
    page.wait_for_selector(tid("location-step"))
    checks["url_city_preselected"] = page.input_value(tid("city-select")) == "ottawa"
    page.fill(tid("postal-code-input"), POSTAL)
    page.select_option(tid("travel-radius-select"), "25")
    page.click(tid("continue-location"))
    page.click(f'{tid("need-option-repair")} input')
    page.fill(tid("issue-description"), ISSUE)
    page.click(tid("continue-need"))
    page.wait_for_selector(tid("next-step-notice"))
    saved = json.loads(page.evaluate("k => localStorage.getItem(k)", WIZ_KEY))["state"]
    checks["wizard_progress_saved_in_browser"] = saved["postalCode"] == POSTAL and saved["citySlug"] == "ottawa"
    checks["attribution_unchanged_after_wizard"] = (
        json.loads(page.evaluate("k => localStorage.getItem(k)", ATTR_KEY))["original"] == original)
    page.wait_for_timeout(35000)  # two overlay status messages (15 s apart) and any batched beacon
    # 4. Preview and its health checks.
    api = ctx.request.get(f"{BASE}/api/health")
    overlay = ctx.request.get(f"{BASE}/__emergent_overlay__/health")
    checks["api_health"] = f"{api.status} {api.text()[:120]}"
    checks["overlay_health"] = f"{overlay.status} {overlay.text()[:160]}"
    page.goto(f"{BASE}/", wait_until="domcontentloaded")  # leaving the page flushes unload beacons
    page.wait_for_selector("h1")
    page.wait_for_timeout(3000)
    info = {
        "rrweb_on_window": page.evaluate("'rrweb' in window"),
        "recorder_script_tags": page.eval_on_selector_all(
            "script[src]", "els => els.map(e => e.src).filter(s => /recorder|rrweb/i.test(s))"),
        "overlay_present_on_page": page.evaluate("'__EMERGENT_OVERLAY__' in window"),
        "analytics_globals": page.evaluate(
            "['posthog','gtag','ga','dataLayer','mixpanel','analytics','hj','clarity','FS'].filter(k => k in window)"),
        "cookies": sorted({c["name"] for c in ctx.cookies()}),
        "referrer_policy_response_header_by_page": document_policies,
        "document_referrer_policy_seen_by_page": page.evaluate(
            "(() => { const a = document.createElement('a'); return a.referrerPolicy || '(inherits document policy)'; })()"),
    }
    reqs = []
    for request_id, request in sent.items():
        url = request["url"]
        if url.startswith(("data:", "blob:")):
            continue
        headers = wire.get(request_id) or {k.lower(): v for k, v in request.get("headers", {}).items()}
        referer = headers.get("referer", "")
        body = request.get("postData") or "".join(bodies.get((request["method"], url), [])[:1])
        p = urlparse(url)
        reqs.append({
            "group": group(url), "method": request["method"], "host": p.netloc, "path": p.path, "query": p.query,
            "wire_headers_captured": request_id in wire, "referer": referer, "body_bytes": len(body),
            "referer_has_attribution": found(ATTRIBUTION, referer),
            "referer_has_query_string": "?" in referer,
            "attribution_in_address": found(ATTRIBUTION, url),
            "attribution_in_body": found(ATTRIBUTION, body),
            "wizard_input_anywhere": found(WIZARD_INPUT, url, body, json.dumps(headers)),
            "synthetic_secret_anywhere": bool(found([SYNTHETIC_SECRET], url, body, json.dumps(headers))),
            "body_excerpt": body[:500],
        })
    info["recorder_requests"] = sorted({r["path"] for r in reqs if re.search("recorder|rrweb", r["path"], re.I)})
    ctx.close()
    return reqs, info, checks


def summarise(reqs):
    rows = {}
    for r in reqs:
        key = (r["group"], r["method"], r["host"], r["path"][:60])
        g = rows.setdefault(key, {"count": 0, "referers": set(), "ref_attr": False, "ref_query": False,
                                  "addr_attr": False, "body_attr": False, "wizard": False, "secret": False, "wire": 0})
        g["count"] += 1
        g["wire"] += r["wire_headers_captured"]
        g["referers"].add(re.sub(r"\?.*", "?…", r["referer"]) or "(none)")
        g["ref_attr"] |= bool(r["referer_has_attribution"])
        g["ref_query"] |= r["referer_has_query_string"]
        g["addr_attr"] |= bool(r["attribution_in_address"])
        g["body_attr"] |= bool(r["attribution_in_body"])
        g["wizard"] |= bool(r["wizard_input_anywhere"])
        g["secret"] |= r["synthetic_secret_anywhere"]
    return [{"group": k[0], "method": k[1], "host": k[2], "path": k[3], "count": g["count"],
             "wire_headers_captured": g["wire"], "referer_values": sorted(g["referers"]),
             "referer_has_attribution": g["ref_attr"], "referer_has_query_string": g["ref_query"],
             "attribution_in_address": g["addr_attr"], "attribution_in_body": g["body_attr"],
             "wizard_input": g["wizard"], "synthetic_secret": g["secret"]} for k, g in sorted(rows.items())]


def render(browser, vp, rows, info, checks, total):
    yn = lambda v: "<b style='color:#b00'>YES</b>" if v else "no"
    body = "".join(
        f"<tr><td>{html.escape(r['group'])}</td><td>{r['method']}</td><td>{html.escape(r['host'])}</td>"
        f"<td>{html.escape(r['path'])}</td><td>{r['count']}</td><td>{html.escape(', '.join(r['referer_values']))}</td>"
        f"<td>{yn(r['referer_has_attribution'])}</td><td>{yn(r['attribution_in_address'])}</td>"
        f"<td>{yn(r['attribution_in_body'])}</td><td>{yn(r['wizard_input'])}</td><td>{yn(r['synthetic_secret'])}</td></tr>"
        for r in rows)
    lines = "".join(f"<div>{html.escape(k)}: <b>{html.escape(str(v))}</b></div>" for k, v in {**checks, **info}.items())
    doc = (f"<html><body style='font:13px/1.35 Arial;margin:16px;background:#fff;color:#111'>"
           f"<h2 style='margin:0 0 4px'>Referer and attribution check — {html.escape(LABEL)} — viewport {vp}</h2>"
           f"<div>Target: {html.escape(BASE)} &nbsp; Requests: {total}. Synthetic values only. Headers are the ones the "
           f"browser put on the wire. Rendered from the test browser's log (a headless browser has no DevTools panel).</div>"
           f"<div style='margin:8px 0;padding:8px;background:#eef;border:1px solid #99c'>{lines}</div>"
           f"<table border='1' cellspacing='0' cellpadding='4' style='border-collapse:collapse;font-size:12px'>"
           f"<tr style='background:#ddd'><th>Group</th><th>Method</th><th>Host</th><th>Path</th><th>Count</th>"
           f"<th>Referer sent</th><th>Attribution in Referer</th><th>Attribution in address</th>"
           f"<th>Attribution in body</th><th>Wizard input</th><th>Synthetic secret</th></tr>{body}</table></body></html>")
    page = browser.new_page(viewport={"width": 1600, "height": 900})
    page.set_content(doc)
    page.screenshot(path=str(OUT / f"referrer-check-{LABEL}-{vp}.jpg"), type="jpeg", quality=60, full_page=True)
    page.close()


with sync_playwright() as p:
    launch = {}
    if os.environ.get("PLAYWRIGHT_CHROME_EXECUTABLE_PATH"):
        launch["executable_path"] = os.environ["PLAYWRIGHT_CHROME_EXECUTABLE_PATH"]
    browser = p.chromium.launch(**launch)
    report = {"label": LABEL, "target": BASE, "synthetic_attribution_query": QUERY, "viewports": {}}
    for vp in VIEWPORTS:
        reqs, info, checks = run(browser, vp)
        rows = summarise(reqs)
        render(browser, vp, rows, info, checks, len(reqs))
        report["viewports"][vp] = {"total_requests": len(reqs), "checks": checks, "page": info, "summary": rows,
                                   "requests": reqs}
        print(f"== {vp}: {len(reqs)} requests; wire headers captured for {sum(r['wire_headers_captured'] for r in reqs)}")
        print("   checks:", json.dumps(checks))
        print("   page:", json.dumps(info))
        for r in rows:
            flags = [k for k in ("referer_has_attribution", "referer_has_query_string", "attribution_in_address",
                                 "attribution_in_body", "wizard_input", "synthetic_secret") if r[k]]
            print(f"   {r['group'][:26]:<26} {r['method']:<5} {r['path'][:46]:<46} x{r['count']:<3} "
                  f"referer={r['referer_values']} {flags or ''}")
    browser.close()
    (OUT / f"referrer-check-{LABEL}.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
