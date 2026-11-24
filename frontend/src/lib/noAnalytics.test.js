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

test("the dev-server configuration forces the preview session recorder off before the overlay loads", () => {
  const config = fs.readFileSync(path.resolve(__dirname, "../../craco.config.js"), "utf8");
  const switchOff = config.indexOf('process.env.EMERGENT_OVERLAY_RRWEB = "";');
  const overlayLoad = config.indexOf('require("@emergentbase/overlay/craco")');
  expect(switchOff).toBeGreaterThan(-1);
  expect(overlayLoad).toBeGreaterThan(switchOff);
  expect(config).toContain('process.env.EMERGENT_OVERLAY_NETWORK = "off";');
  // The overlay itself may only ever be loaded by the dev server, never by a production build.
  expect(config).toMatch(/if \(isDevServer && process\.env\.DISABLE_EMERGENT_OVERLAY !== "true"\)/);
});

test("the dev-server configuration sends Referrer-Policy: no-referrer on review previews only", () => {
  const config = fs.readFileSync(path.resolve(__dirname, "../../craco.config.js"), "utf8");
  // Set on the dev server's response headers, so attribution values in the page address are not
  // attached to requests made by the page, the development overlay or the preview host's scripts.
  expect(config).toMatch(/compatibleConfig\.headers = \{[^}]*"Referrer-Policy": "no-referrer"/s);
  // Production settings are not changed by this: neither the page template nor the hosting config sets it.
  expect(template).not.toMatch(/referrer/i);
  const vercel = fs.readFileSync(path.resolve(__dirname, "../../vercel.json"), "utf8");
  expect(vercel).not.toMatch(/referrer/i);
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
