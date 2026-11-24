import fs from "fs";
import path from "path";

/**
 * The public page template must not load analytics, session recording or platform scripts.
 * Approved by Sam on 2026-11-24: removed, and not to be replaced by another provider.
 */
const template = fs.readFileSync(path.resolve(__dirname, "../../public/index.html"), "utf8");

test("the page template loads no analytics, session-recording or platform script", () => {
  expect(template).not.toMatch(/posthog|emergent-main|ap\.emergent\.sh|assets\.emergent\.sh|session_recording/i);
  expect(template).not.toMatch(/google-analytics|googletagmanager|gtag\(|hotjar|clarity\.ms|segment\.com|mixpanel|fullstory|facebook\.net/i);
  expect(template).not.toMatch(/<script[^>]+src=/i);
});

test("the application source references no analytics client", () => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });
  walk(path.resolve(__dirname, "..")).forEach((file) => {
    expect(fs.readFileSync(file, "utf8")).not.toMatch(/posthog|sendBeacon|document\.cookie/i);
  });
});
