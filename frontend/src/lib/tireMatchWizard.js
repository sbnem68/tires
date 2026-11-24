export const WIZARD_STORAGE_KEY = "t4t.tire_match_wizard.v1";
/** Session marker: the URL city that has already been applied in this browser session. */
export const URL_CITY_SESSION_KEY = "t4t.tire_match_wizard.url_city.v1";

export const NEED_OPTIONS = [
  { value: "buy_2", label: "Buy 2 tires" },
  { value: "buy_4", label: "Buy 4 tires" },
  { value: "changeover", label: "Winter tire changeover" },
  { value: "repair", label: "Tire repair or inspection" },
  { value: "unsure", label: "I’m not sure — help me choose" },
];

export const RADIUS_OPTIONS = [
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
  { value: "50", label: "Within 50 km" },
  { value: "flexible", label: "Flexible" },
];

export const INITIAL_WIZARD_STATE = {
  step: 1,
  citySlug: "",
  postalCode: "",
  radius: "",
  need: "",
  winterNeedsNewTires: null,
  issueDescription: "",
  outcome: null,
};

const safeStorage = (providedStorage) => {
  if (providedStorage) return providedStorage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const validStep = (step) => (step === 2 ? 2 : 1);

export const readWizardProgress = (providedStorage) => {
  const storage = safeStorage(providedStorage);
  if (!storage) return null;

  try {
    const parsed = JSON.parse(storage.getItem(WIZARD_STORAGE_KEY) || "null");
    if (!parsed || parsed.version !== 1 || !parsed.state || typeof parsed.state !== "object") return null;

    const stored = parsed.state;
    return {
      step: validStep(stored.step),
      citySlug: typeof stored.citySlug === "string" ? stored.citySlug : "",
      postalCode: typeof stored.postalCode === "string" ? stored.postalCode : "",
      radius: RADIUS_OPTIONS.some((option) => option.value === stored.radius) ? stored.radius : "",
      need: NEED_OPTIONS.some((option) => option.value === stored.need) ? stored.need : "",
      winterNeedsNewTires: typeof stored.winterNeedsNewTires === "boolean" ? stored.winterNeedsNewTires : null,
      issueDescription: typeof stored.issueDescription === "string" ? stored.issueDescription.slice(0, 300) : "",
      outcome: typeof stored.outcome === "string" ? stored.outcome : null,
    };
  } catch (error) {
    return null;
  }
};

export const saveWizardProgress = (state, providedStorage) => {
  const storage = safeStorage(providedStorage);
  if (!storage) return false;

  const persisted = {
    version: 1,
    state: {
      step: validStep(state.step),
      citySlug: state.citySlug || "",
      postalCode: state.postalCode || "",
      radius: state.radius || "",
      need: state.need || "",
      winterNeedsNewTires: typeof state.winterNeedsNewTires === "boolean" ? state.winterNeedsNewTires : null,
      issueDescription: (state.issueDescription || "").slice(0, 300),
      outcome: state.outcome || null,
    },
  };

  try {
    storage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(persisted));
    return true;
  } catch (error) {
    return false;
  }
};

const sessionStore = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
};

/** The `city` URL parameter, lower-cased. Empty when absent. Validity is checked against the API list. */
export const requestedCityFrom = (search = "") =>
  new URLSearchParams(search).get("city")?.trim().toLowerCase() || "";

export const readAppliedUrlCity = () => {
  try {
    return sessionStore()?.getItem(URL_CITY_SESSION_KEY) || "";
  } catch (error) {
    return "";
  }
};

/**
 * Records that the URL city has been applied (or deliberately replaced by the driver) in this
 * session, so a refresh or in-app navigation does not undo a later manual city change.
 * This never touches the attribution record.
 */
export const markUrlCityApplied = (slug) => {
  if (!slug) return;
  try {
    sessionStore()?.setItem(URL_CITY_SESSION_KEY, slug);
  } catch (error) {
    /* storage unavailable: the URL city is simply applied again on the next load */
  }
};

export const createInitialWizardState = ({
  search = "",
  selectedCitySlug = "",
  savedProgress = readWizardProgress(),
} = {}) => {
  const requestedCity = requestedCityFrom(search);
  const base = savedProgress || INITIAL_WIZARD_STATE;
  return {
    ...INITIAL_WIZARD_STATE,
    ...base,
    // Provisional until the city list has loaded; resolveInitialCity() makes the final decision.
    citySlug: requestedCity || savedProgress?.citySlug || selectedCitySlug || "",
    savedCitySlug: savedProgress?.citySlug || "",
    hasSavedProgress: Boolean(savedProgress),
  };
};

/**
 * Decides the selected city once the listed cities are known.
 *
 * Precedence (approved by Sam, 2026-11-24):
 *   1. A valid listed city in the URL wins and becomes the selected city.
 *   2. Otherwise saved wizard progress.
 *   3. Otherwise the city the driver last chose on the site (stored apart from attribution).
 *   4. Otherwise nothing is selected and the driver must choose.
 *
 * A URL city is applied once per browser session. After that, a refresh or in-app navigation
 * keeps whatever the driver has since chosen, so no selection is lost on refresh.
 * The original attribution record is never read or written here.
 */
export const resolveInitialCity = ({
  state,
  cities,
  search = "",
  selectedCitySlug = "",
  appliedUrlCity = readAppliedUrlCity(),
}) => {
  const available = new Set(cities.map((city) => city.slug));
  const valid = (slug) => Boolean(slug) && available.has(slug);
  const requestedCity = requestedCityFrom(search);
  const savedCity = state.hasSavedProgress ? state.savedCitySlug : "";

  if (valid(requestedCity) && requestedCity !== appliedUrlCity) {
    return {
      citySlug: requestedCity,
      source: "url",
      // The driver should see the changed city, so return to the location step.
      returnToLocation: valid(savedCity) && savedCity !== requestedCity,
    };
  }
  if (valid(savedCity)) return { citySlug: savedCity, source: "saved", returnToLocation: false };
  if (valid(requestedCity)) return { citySlug: requestedCity, source: "url", returnToLocation: false };
  if (valid(selectedCitySlug)) return { citySlug: selectedCitySlug, source: "selected", returnToLocation: false };
  return { citySlug: "", source: "none", returnToLocation: false };
};

export const canContinueLocation = (state) => Boolean(state.citySlug);

export const getNeedOutcome = (state) => {
  if (state.need === "buy_2" || state.need === "buy_4") return "vehicle_tire_size";
  if (state.need === "unsure") return "guidance_needed";
  if (state.need === "repair") return "repair_inspection";
  if (state.need === "changeover" && state.winterNeedsNewTires === true) return "vehicle_tire_size";
  if (state.need === "changeover" && state.winterNeedsNewTires === false) return "changeover_request";
  return null;
};

export const canContinueNeed = (state) => {
  if (!state.need) return false;
  if (state.need === "changeover") return typeof state.winterNeedsNewTires === "boolean";
  if (state.need === "repair") return Boolean(state.issueDescription.trim());
  return true;
};

export const wizardReducer = (state, action) => {
  switch (action.type) {
    case "set-city":
      return { ...state, citySlug: action.value, outcome: null };
    case "set-postal":
      return { ...state, postalCode: action.value.slice(0, 10) };
    case "set-radius":
      return { ...state, radius: action.value };
    case "set-need":
      return {
        ...state,
        need: action.value,
        winterNeedsNewTires: null,
        issueDescription: "",
        outcome: null,
      };
    case "set-winter-new-tires":
      return { ...state, winterNeedsNewTires: action.value, outcome: null };
    case "set-issue":
      return { ...state, issueDescription: action.value.slice(0, 300), outcome: null };
    case "continue-location":
      return canContinueLocation(state) ? { ...state, step: 2, outcome: null } : state;
    case "continue-need":
      return canContinueNeed(state) ? { ...state, outcome: getNeedOutcome(state) } : state;
    case "back":
      return { ...state, step: 1, outcome: null };
    case "edit-need":
      return { ...state, step: 2, outcome: null };
    case "hydrate-city":
      return action.returnToLocation
        ? { ...state, citySlug: action.value, step: 1, outcome: null }
        : { ...state, citySlug: action.value };
    default:
      return state;
  }
};

/** Driver-facing wording only. Internal checkpoint or development language never appears here. */
export const outcomeCopy = {
  vehicle_tire_size: "Next: vehicle and tire size (coming soon).",
  guidance_needed: "Next: vehicle and tire size (coming soon). We’ll help you choose along the way.",
  changeover_request: "Winter tire changeover noted. The next steps are coming soon.",
  repair_inspection: "Tire repair or inspection noted. The next steps are coming soon.",
};
