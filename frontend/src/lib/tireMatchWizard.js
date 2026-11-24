export const WIZARD_STORAGE_KEY = "t4t.tire_match_wizard.v1";
export const TOTAL_WIZARD_STEPS = 6;

export const TRAVEL_RADIUS_OPTIONS = [
  { value: "10km", label: "Within 10 km" },
  { value: "25km", label: "Within 25 km" },
  { value: "50km", label: "Within 50 km" },
  { value: "flexible", label: "Flexible" },
];

export const NEED_OPTIONS = [
  { value: "buy_2_tires", label: "Buy 2 tires" },
  { value: "buy_4_tires", label: "Buy 4 tires" },
  { value: "winter_changeover", label: "Winter tire changeover" },
  { value: "repair_inspection", label: "Tire repair or inspection" },
  { value: "unsure", label: "I’m not sure — help me choose" },
];

const cleanString = (value, maxLength = 500) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const normalizeSlug = (value) => cleanString(value, 100).toLowerCase();

const getBrowserStorage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch (error) {
    return null;
  }
};

export const readWizardProgress = (storage = getBrowserStorage()) => {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(WIZARD_STORAGE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    return {
      step: parsed.step === 2 ? 2 : 1,
      city: normalizeSlug(parsed.city),
      cityManuallySelected: parsed.cityManuallySelected === true,
      postalCode: cleanString(parsed.postalCode, 16),
      travelRadius: TRAVEL_RADIUS_OPTIONS.some((option) => option.value === parsed.travelRadius)
        ? parsed.travelRadius
        : "",
      need: NEED_OPTIONS.some((option) => option.value === parsed.need) ? parsed.need : "",
      newTires: ["yes", "no"].includes(parsed.newTires) ? parsed.newTires : "",
      issueDescription: cleanString(parsed.issueDescription, 500),
      showNextStep: parsed.showNextStep === true,
    };
  } catch (error) {
    return null;
  }
};

export const createInitialWizardState = (search = "", selectedCitySlug = "", saved = readWizardProgress()) => {
  const requestedCity = normalizeSlug(new URLSearchParams(search).get("city"));
  const savedCity = normalizeSlug(saved?.city);
  const shouldKeepManualChoice = Boolean(saved?.cityManuallySelected && savedCity);
  const city = shouldKeepManualChoice
    ? savedCity
    : requestedCity || savedCity || normalizeSlug(selectedCitySlug);

  return {
    step: saved?.step === 2 ? 2 : 1,
    city,
    cityManuallySelected: shouldKeepManualChoice,
    postalCode: cleanString(saved?.postalCode, 16),
    travelRadius: TRAVEL_RADIUS_OPTIONS.some((option) => option.value === saved?.travelRadius)
      ? saved.travelRadius
      : "",
    need: NEED_OPTIONS.some((option) => option.value === saved?.need) ? saved.need : "",
    newTires: ["yes", "no"].includes(saved?.newTires) ? saved.newTires : "",
    issueDescription: cleanString(saved?.issueDescription, 500),
    showNextStep: saved?.showNextStep === true,
  };
};

export const saveWizardProgress = (state, storage = getBrowserStorage()) => {
  if (!storage) return false;
  const safeState = {
    step: state.step === 2 ? 2 : 1,
    city: normalizeSlug(state.city),
    cityManuallySelected: state.cityManuallySelected === true,
    postalCode: cleanString(state.postalCode, 16),
    travelRadius: TRAVEL_RADIUS_OPTIONS.some((option) => option.value === state.travelRadius)
      ? state.travelRadius
      : "",
    need: NEED_OPTIONS.some((option) => option.value === state.need) ? state.need : "",
    newTires: ["yes", "no"].includes(state.newTires) ? state.newTires : "",
    issueDescription: cleanString(state.issueDescription, 500),
    showNextStep: state.showNextStep === true,
  };
  try {
    storage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(safeState));
    return true;
  } catch (error) {
    return false;
  }
};

export const canContinueFromNeed = ({ need, newTires }) =>
  NEED_OPTIONS.some((option) => option.value === need)
  && (need !== "winter_changeover" || ["yes", "no"].includes(newTires));

export const getNextStep = ({ need, newTires }) => {
  if (need === "winter_changeover") {
    return newTires === "yes"
      ? { destination: "vehicle_tire_size", label: "Vehicle and tire-size details", guidanceNeeded: false }
      : newTires === "no"
        ? { destination: "changeover_request", label: "Changeover request details", guidanceNeeded: false }
        : null;
  }
  if (need === "repair_inspection") {
    return { destination: "repair_inspection", label: "Repair or inspection details", guidanceNeeded: false };
  }
  if (need === "buy_2_tires" || need === "buy_4_tires") {
    return { destination: "vehicle_tire_size", label: "Vehicle and tire-size details", guidanceNeeded: false };
  }
  if (need === "unsure") {
    return { destination: "vehicle_tire_size", label: "Vehicle and tire-size details", guidanceNeeded: true };
  }
  return null;
};
