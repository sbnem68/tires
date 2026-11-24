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
  vehicle: { make: "", model: "", year: "", trim: "", tireSize: "", tireType: "Unknown", condition: "", saved: false },
};

export const TIRE_TYPES = ["Winter", "All-season", "Summer", "Performance", "Unknown"];
export const TIRE_CONDITIONS = ["New", "Good", "Worn", "Damaged", "Unknown"];

export const normalizeTireSize = (value = "") => {
  const compact = value.toUpperCase().replace(/\s+/g, "");
  // Check the shape, not whether the size is suitable for a particular vehicle.
  return /^(?:P|LT|ST|T)?[1-9]\d{2}\/[1-9]\d(?:R|D|B)[1-9]\d(?:\.\d)?$/.test(compact) ? compact : "";
};

const readVehicle = (value) => {
  const field = (name, limit) => typeof value?.[name] === "string" ? value[name].slice(0, limit) : "";
  const tireSize = field("tireSize", 40);
  return {
    make: field("make", 60),
    model: field("model", 60),
    year: field("year", 4).replace(/\D/g, ""),
    trim: field("trim", 60),
    tireSize,
    tireType: TIRE_TYPES.includes(value?.tireType) ? value.tireType : "Unknown",
    condition: TIRE_CONDITIONS.includes(value?.condition) ? value.condition : "",
    saved: value?.saved === true && Boolean(normalizeTireSize(tireSize)),
  };
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

const validStep = (step) => (step === 2 || step === 3 ? step : 1);

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
      vehicle: readVehicle(stored.vehicle),
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
      vehicle: readVehicle(state.vehicle),
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
  savedProgress = readWizardProgress(),
} = {}) => {
  const requestedCity = requestedCityFrom(search);
  const base = savedProgress || INITIAL_WIZARD_STATE;
  return {
    ...INITIAL_WIZARD_STATE,
    ...base,
    // Provisional until the city list has loaded; resolveInitialCity() makes the final decision.
    citySlug: requestedCity || savedProgress?.citySlug || "",
    savedCitySlug: savedProgress?.citySlug || "",
    hasSavedProgress: Boolean(savedProgress),
  };
};

/**
 * Decides the selected city once the listed cities are known.
 *
 * Strict precedence (approved by Sam, 2026-11-24):
 *   1. A valid listed city in the URL.
 *   2. Saved wizard progress.
 *   3. Nothing selected: the driver must choose.
 *
 * The city the driver chose elsewhere on the site, or on a previous visit, is never used.
 *
 * A URL city is applied once per browser session, so a refresh does not undo a manual city
 * change made afterwards. When a URL city replaces a different saved city the wizard returns
 * to the location step and keeps every other answer.
 * The original attribution record is never read or written here.
 */
export const resolveInitialCity = ({ state, cities, search = "", appliedUrlCity = readAppliedUrlCity() }) => {
  const available = new Set(cities.map((city) => city.slug));
  const valid = (slug) => Boolean(slug) && available.has(slug);
  const requestedCity = requestedCityFrom(search);
  const savedCity = state.hasSavedProgress ? state.savedCitySlug : "";

  if (valid(requestedCity) && requestedCity !== appliedUrlCity) {
    return {
      citySlug: requestedCity,
      source: "url",
      returnToLocation: valid(savedCity) && savedCity !== requestedCity,
    };
  }
  if (valid(savedCity)) return { citySlug: savedCity, source: "saved", returnToLocation: false };
  // The URL city was already applied this session and nothing has been saved since.
  if (valid(requestedCity)) return { citySlug: requestedCity, source: "url", returnToLocation: false };
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

const entersVehicleStep = (outcome) => outcome === "vehicle_tire_size" || outcome === "guidance_needed";

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
    case "continue-need": {
      if (state.step !== 2 || !state.citySlug || !canContinueNeed(state)) return state;
      const outcome = getNeedOutcome(state);
      return { ...state, outcome, step: entersVehicleStep(outcome) ? 3 : 2 };
    }
    case "set-vehicle-field":
      return state.step === 3 && Object.hasOwn(INITIAL_WIZARD_STATE.vehicle, action.field) && action.field !== "saved"
        ? { ...state, vehicle: readVehicle({ ...state.vehicle, [action.field]: action.value, saved: false }) }
        : state;
    case "save-vehicle": {
      const tireSize = normalizeTireSize(state.vehicle.tireSize);
      return state.step === 3 && tireSize
        ? { ...state, vehicle: { ...state.vehicle, tireSize, saved: true } }
        : state;
    }
    case "edit-vehicle":
      return state.step === 3 ? { ...state, vehicle: { ...state.vehicle, saved: false } } : state;
    case "back":
      return { ...state, step: state.step === 3 ? 2 : 1, outcome: null };
    case "edit-need":
      return { ...state, step: 2, outcome: null };
    case "hydrate-city": {
      if (action.returnToLocation || !action.value) {
        return { ...state, citySlug: action.value, step: 1, outcome: null };
      }
      if (state.step === 3) {
        const outcome = getNeedOutcome(state);
        return canContinueNeed(state) && entersVehicleStep(outcome)
          ? { ...state, citySlug: action.value, outcome }
          : { ...state, citySlug: action.value, step: 2, outcome: null };
      }
      return { ...state, citySlug: action.value };
    }
    default:
      return state;
  }
};

/** Driver-facing wording only. Internal checkpoint or development language never appears here. */
export const outcomeCopy = {
  changeover_request: "Winter tire changeover noted. The next steps are coming soon.",
  repair_inspection: "Tire repair or inspection noted. The next steps are coming soon.",
};
