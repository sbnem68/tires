#!/usr/bin/env python3
"""Checkpoint 2 closeout network check.

A driver lands with a full set of attribution parameters, completes wizard Steps 1 and 2 with typed
input, and waits long enough for every timed message to leave the browser. Every request is recorded
with its address, body and Referer header, and sorted into four groups: application, development
overlay, preview host, fonts. Each is searched for wizard input, attribution parameters and secrets.

Read-only. Usage: T4T_BASE_URL=<url> python3 closeout_network_check.py <label> <output-dir>
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
QUERY = ("city=ottawa&source=partnerzz&campaign=fallzz&shop=shopzz-1&package=fullzz&price=quotedzz"
         "&utm_source=firstzz&utm_medium=emailzz&utm_campaign=launchzz")
WIZARD_INPUT = ["K1A 0B1", "K1A%200B1", "K1A+0B1", "zebra-quartz"]
ATTRIBUTION = ["partnerzz", "fallzz", "shopzz-1", "fullzz", "quotedzz", "firstzz", "emailzz", "launchzz", "utm_"]


def secrets():
    """Secret values from the workspace, used only for comparison; never printed or stored."""
    found = []
    token = os.environ.get("GITHUB_TOKEN", "")
    if token:
        found.append(token)
    env = Path("/app/backend/.env")
    if env.exists():
        m = re.search(r"^DATABASE_URL=.*?://[^:]+:([^@]+)@", env.read_text(), re.M)
        if m:
            found.append(m.group(1))
    return [s for s in found if len(s) >= 8]


SECRETS = secrets()


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


def hits(needles, *texts):
    return sorted({n for n in needles for t in texts if t and n in t})


def run(browser, vp):
    ctx = browser.new_context(**VIEWPORTS[vp])
    reqs = []

    def on_request(r):
        body = decode(r.post_data_buffer)
        referer = r.headers.get("referer", "")
        p = urlparse(r.url)
        reqs.append({
            "group": group(r.url), "method": r.method, "host": p.netloc, "path": p.path, "query": p.query,
            "resource": r.resource_type, "body_bytes": len(r.post_data_buffer or b""),
            "wizard_input_in_url_or_body": hits(WIZARD_INPUT, r.url, body),
            "attribution_in_url": hits(ATTRIBUTION, r.url),
            "attribution_in_body": hits(ATTRIBUTION, body),
            "attribution_in_referer": hits(ATTRIBUTION, referer),
            "wizard_input_in_referer": hits(WIZARD_INPUT, referer),
            "secret_found": bool(hits(SECRETS, r.url, body, json.dumps(r.headers))),
            "referer": referer, "body_excerpt": body[:700],
        })

    ctx.on("request", on_request)
    page = ctx.new_page()
    page.set_default_timeout(20000)
    page.goto(f"{BASE}/ottawa?{QUERY}", wait_until="domcontentloaded")
    page.wait_for_selector("h1")
    page.goto(f"{BASE}/tire-match?{QUERY}", wait_until="domcontentloaded")
    page.wait_for_selector(tid("location-step"))
    page.fill(tid("postal-code-input"), "K1A 0B1")
    page.select_option(tid("travel-radius-select"), "25")
    page.click(tid("continue-location"))
    page.click(f'{tid("need-option-repair")} input')
    page.fill(tid("issue-description"), "Slow leak zebra-quartz front tire")
    page.click(tid("continue-need"))
    page.wait_for_selector(tid("next-step-notice"))
    page.wait_for_timeout(35000)  # two overlay heartbeats (15 s each) and any batched beacon
    page.goto(f"{BASE}/", wait_until="domcontentloaded")  # leaving the page flushes unload beacons
    page.wait_for_timeout(3000)
    info = {
        "rrweb_on_window": page.evaluate("'rrweb' in window"),
        "recorder_script_tags": page.eval_on_selector_all(
            "script[src]", "els => els.map(e => e.src).filter(s => /recorder|rrweb/i.test(s))"),
        "recorder_requests": sorted({r["path"] for r in reqs if re.search("recorder|rrweb", r["path"], re.I)}),
        "analytics_globals": page.evaluate(
            "['posthog','gtag','ga','dataLayer','mixpanel','analytics','hj','clarity','FS'].filter(k => k in window)"),
        "cookies": sorted({c["name"] for c in ctx.cookies()}),
    }
    ctx.close()
    return reqs, info


def summarise(reqs):
    rows = {}
    for r in reqs:
        key = (r["group"], r["method"], r["host"], r["path"][:64])
        g = rows.setdefault(key, {"count": 0, "body_bytes": 0, "wizard_input": set(), "attr_url": set(),
                                  "attr_body": set(), "attr_referer": set(), "secret": False})
        g["count"] += 1
        g["body_bytes"] += r["body_bytes"]
        g["wizard_input"] |= set(r["wizard_input_in_url_or_body"]) | set(r["wizard_input_in_referer"])
        g["attr_url"] |= set(r["attribution_in_url"])
        g["attr_body"] |= set(r["attribution_in_body"])
        g["attr_referer"] |= set(r["attribution_in_referer"])
        g["secret"] = g["secret"] or r["secret_found"]
    return [{"group": k[0], "method": k[1], "host": k[2], "path": k[3], "count": g["count"],
             "body_bytes": g["body_bytes"], "wizard_input": bool(g["wizard_input"]),
             "attribution_in_address": bool(g["attr_url"]), "attribution_in_body": bool(g["attr_body"]),
             "attribution_in_referer_header": bool(g["attr_referer"]), "secret": g["secret"]}
            for k, g in sorted(rows.items())]


def render(browser, vp, rows, info, total):
    yn = lambda v: "<b style='color:#b00'>YES</b>" if v else "no"
    body = "".join(
        f"<tr><td>{html.escape(r['group'])}</td><td>{r['method']}</td><td>{html.escape(r['host'])}</td>"
        f"<td>{html.escape(r['path'])}</td><td>{r['count']}</td><td>{r['body_bytes']}</td><td>{yn(r['wizard_input'])}</td>"
        f"<td>{yn(r['attribution_in_address'])}</td><td>{yn(r['attribution_in_body'])}</td>"
        f"<td>{yn(r['attribution_in_referer_header'])}</td><td>{yn(r['secret'])}</td></tr>" for r in rows)
    doc = (f"<html><body style='font:13px/1.35 Arial;margin:16px;background:#fff;color:#111'>"
           f"<h2 style='margin:0 0 4px'>Closeout network check — {html.escape(LABEL)} — viewport {vp}</h2>"
           f"<div>Target: {html.escape(BASE)} &nbsp; Requests recorded: {total}. Rendered from the test browser's "
           f"request log (a headless browser has no DevTools panel).</div>"
           f"<div style='margin:8px 0;padding:8px;background:#eef;border:1px solid #99c'><b>Recorder: window.rrweb = "
           f"{info['rrweb_on_window']}; recorder scripts = {info['recorder_script_tags'] or 'none'}; recorder requests = "
           f"{info['recorder_requests'] or 'none'}. Cookies: {info['cookies'] or 'none'}.</b></div>"
           f"<table border='1' cellspacing='0' cellpadding='4' style='border-collapse:collapse;font-size:12px'>"
           f"<tr style='background:#ddd'><th>Group</th><th>Method</th><th>Host</th><th>Path</th><th>Count</th><th>Body bytes</th>"
           f"<th>Wizard input</th><th>Attribution in address</th><th>Attribution in body</th>"
           f"<th>Attribution in Referer header</th><th>Secret</th></tr>{body}</table></body></html>")
    page = browser.new_page(viewport={"width": 1500, "height": 900})
    page.set_content(doc)
    page.screenshot(path=str(OUT / f"closeout-network-{LABEL}-{vp}.jpg"), type="jpeg", quality=60, full_page=True)
    page.close()


with sync_playwright() as p:
    launch = {}
    if os.environ.get("PLAYWRIGHT_CHROME_EXECUTABLE_PATH"):
        launch["executable_path"] = os.environ["PLAYWRIGHT_CHROME_EXECUTABLE_PATH"]
    browser = p.chromium.launch(**launch)
    report = {"label": LABEL, "target": BASE, "attribution_query_used": QUERY,
              "secrets_compared": len(SECRETS), "viewports": {}}
    for vp in VIEWPORTS:
        reqs, info = run(browser, vp)
        rows = summarise(reqs)
        render(browser, vp, rows, info, len(reqs))
        for r in reqs:  # never store a header or body that matched a secret
            if r["secret_found"]:
                r["referer"], r["body_excerpt"] = "<withheld>", "<withheld>"
        report["viewports"][vp] = {"total_requests": len(reqs), "page": info, "summary": rows, "requests": reqs}
        print(vp, "requests:", len(reqs), "|", json.dumps(info))
        for r in rows:
            flags = [k for k in ("wizard_input", "attribution_in_address", "attribution_in_body",
                                 "attribution_in_referer_header", "secret") if r[k]]
            print(f"   {r['group']:<28} {r['method']:<5} {r['host'][:28]:<28} {r['path'][:52]:<52} x{r['count']:<3} {flags or ''}")
    browser.close()
    (OUT / f"closeout-network-{LABEL}.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
