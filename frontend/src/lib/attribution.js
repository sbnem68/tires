/**
 * Attribution capture (Checkpoint 1).
 *
 * The ORIGINAL touch is written once and never overwritten by navigation, by changing the
 * selected city, or by later visits. It is kept separately from the driver's selected city.
 *
 * - A landing without any tracked parameter is stored as a provisional (organic) original.
 *   The first landing that carries tracked parameters replaces a provisional original.
 * - Once an original with parameters exists it is locked for 30 days; a later landing with
 *   different parameters is recorded as `last_touch` only.
 */

const STORAGE_KEY = "t4t.attribution.v1";
const SELECTED_CITY_KEY = "t4t.selected_city.v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LENGTH = 500;

/** Parameters read from the URL query string. */
export const URL_PARAM_KEYS = [
  "city",
  "source",
  "campaign",
  "shop",
  "package",
  "price",
  "utm_source",
  "utm_medium",
  "utm_campaign",
];

/** Every attribution field preserved for the lead (Checkpoint 7 will submit these). */
export const ATTRIBUTION_KEYS = [...URL_PARAM_KEYS, "referrer_url", "landing_url"];

/** Query parameters used by staging review tools; never part of attribution. */
const INTERNAL_PARAMS = ["preview_state", "wizard_preview"];

const clean = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_LENGTH) : null;
};

const storage = {
  read(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable (private mode / blocked): attribution lives for this page only */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  },
};

const externalReferrer = () => {
  const ref = document.referrer;
  if (!ref) return null;
  try {
    return new URL(ref).origin === window.location.origin ? null : clean(ref);
  } catch (e) {
    return null;
  }
};

const readTouch = () => {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const touch = {};
  URL_PARAM_KEYS.forEach((key) => {
    touch[key] = clean(params.get(key));
  });
  const hasParams = URL_PARAM_KEYS.some((key) => touch[key] !== null);

  // referrer_url / landing_url may be passed in explicitly (e.g. from an embed); otherwise derived.
  const explicitReferrer = clean(params.get("referrer_url"));
  const explicitLanding = clean(params.get("landing_url"));
  INTERNAL_PARAMS.forEach((key) => url.searchParams.delete(key));
  touch.referrer_url = explicitReferrer || externalReferrer();
  touch.landing_url = explicitLanding || clean(url.toString());

  const firstSegment = url.pathname.split("/").filter(Boolean)[0] || null;
  return {
    touch,
    hasParams,
    meta: { landing_path: url.pathname, landing_path_city: firstSegment, captured_at: new Date().toISOString() },
  };
};

const sameTouch = (a, b) => URL_PARAM_KEYS.every((key) => (a?.[key] ?? null) === (b?.[key] ?? null));

let capturedThisLoad = false;

/** Call once per page load, before any client-side redirect. Safe to call repeatedly. */
export const captureAttribution = () => {
  if (capturedThisLoad) return;
  capturedThisLoad = true;

  const { touch, hasParams, meta } = readTouch();
  const stored = storage.read(STORAGE_KEY);
  const expired = !stored?.original_meta?.captured_at
    || Date.now() - new Date(stored.original_meta.captured_at).getTime() > TTL_MS;

  if (!stored || expired) {
    storage.write(STORAGE_KEY, { original: touch, original_meta: meta, original_has_params: hasParams, last_touch: null });
    return;
  }
  if (!hasParams) return; // plain navigation or organic revisit: nothing changes
  if (!stored.original_has_params) {
    storage.write(STORAGE_KEY, { original: touch, original_meta: meta, original_has_params: true, last_touch: null });
    return;
  }
  if (!sameTouch(stored.original, touch)) {
    storage.write(STORAGE_KEY, { ...stored, last_touch: { ...touch, ...meta } });
  }
};

/** Full stored record: { original, original_meta, original_has_params, last_touch }. */
export const getAttributionRecord = () => storage.read(STORAGE_KEY);

/** Flat original attribution with all 11 keys present (null when not supplied). */
export const getAttribution = () => {
  const original = storage.read(STORAGE_KEY)?.original || {};
  return ATTRIBUTION_KEYS.reduce((acc, key) => ({ ...acc, [key]: original[key] ?? null }), {});
};

/** Staging review helper only. */
export const clearAttribution = () => {
  storage.remove(STORAGE_KEY);
  storage.remove(SELECTED_CITY_KEY);
  capturedThisLoad = false;
};

/** The driver's currently selected city. Stored apart from attribution on purpose. */
export const getSelectedCity = () => storage.read(SELECTED_CITY_KEY)?.slug || null;

export const setSelectedCity = (slug) => {
  if (slug) storage.write(SELECTED_CITY_KEY, { slug, selected_at: new Date().toISOString() });
};
