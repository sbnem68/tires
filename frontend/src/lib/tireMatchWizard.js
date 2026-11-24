export const WIZARD_STORAGE_KEY = "t4t.tire_match_wizard.v1";

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

export const createInitialWizardState = ({
  search = "",
  selectedCitySlug = "",
  savedProgress = readWizardProgress(),
} = {}) => {
  const requestedCity = new URLSearchParams(search).get("city")?.trim().toLowerCase() || "";
  const base = savedProgress || INITIAL_WIZARD_STATE;
  return {
    ...INITIAL_WIZARD_STATE,
    ...base,
    citySlug: savedProgress?.citySlug || requestedCity || selectedCitySlug || "",
    hasSavedProgress: Boolean(savedProgress),
  };
};

export const resolveInitialCity = ({ state, cities, search = "", selectedCitySlug = "" }) => {
  const available = new Set(cities.map((city) => city.slug));
  const requestedCity = new URLSearchParams(search).get("city")?.trim().toLowerCase() || "";
  const candidates = state.hasSavedProgress
    ? [state.citySlug, requestedCity, selectedCitySlug]
    : [requestedCity, selectedCitySlug, state.citySlug];
  return candidates.find((slug) => slug && available.has(slug)) || "";
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
      return { ...state, citySlug: action.value };
    default:
      return state;
  }
};

export const outcomeCopy = {
  vehicle_tire_size: "Next: vehicle and tire-size selection. That step is outside Checkpoint 2.",
  guidance_needed: "Next: the full intake, marked as guidance needed. The remaining steps are outside Checkpoint 2.",
  changeover_request: "This is routed as a winter tire changeover. The remaining request steps are outside Checkpoint 2.",
  repair_inspection: "This is routed as tire repair or inspection. The remaining request steps are outside Checkpoint 2.",
};
