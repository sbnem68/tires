import {
  canContinueFromNeed,
  createInitialWizardState,
  getNextStep,
  NEED_OPTIONS,
  readWizardProgress,
  saveWizardProgress,
  TRAVEL_RADIUS_OPTIONS,
  WIZARD_STORAGE_KEY,
} from "@/lib/tireMatchWizard";

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

describe("Tire Match wizard state", () => {
  test("offers the five approved need choices and travel-radius values", () => {
    expect(NEED_OPTIONS.map((option) => option.label)).toEqual([
      "Buy 2 tires",
      "Buy 4 tires",
      "Winter tire changeover",
      "Tire repair or inspection",
      "I’m not sure — help me choose",
    ]);
    expect(TRAVEL_RADIUS_OPTIONS.map((option) => option.label)).toEqual([
      "Within 10 km",
      "Within 25 km",
      "Within 50 km",
      "Flexible",
    ]);
  });

  test.each([
    ["?city=ottawa", "ottawa"],
    ["?city=toronto", "toronto"],
    ["?city=hamilton", "hamilton"],
  ])("preselects a supported city from %s", (search, city) => {
    expect(createInitialWizardState(search, "", null).city).toBe(city);
  });

  test("keeps a manually selected city after refresh even when the URL has another city", () => {
    const saved = {
      city: "toronto",
      cityManuallySelected: true,
      step: 2,
      need: "buy_4_tires",
    };
    expect(createInitialWizardState("?city=ottawa", "ottawa", saved).city).toBe("toronto");
  });

  test("stores optional answers locally and restores them", () => {
    const storage = memoryStorage();
    const state = {
      step: 2,
      city: "ottawa",
      cityManuallySelected: true,
      postalCode: "K1A 0B1",
      travelRadius: "25km",
      need: "buy_2_tires",
      newTires: "",
      issueDescription: "",
      showNextStep: true,
    };

    expect(saveWizardProgress(state, storage)).toBe(true);
    expect(storage.getItem(WIZARD_STORAGE_KEY)).toContain("K1A 0B1");
    expect(readWizardProgress(storage)).toMatchObject(state);
  });

  test("does not save invalid option values or arbitrary extra fields", () => {
    const storage = memoryStorage();
    saveWizardProgress({
      step: 99,
      city: "  TORONTO ",
      travelRadius: "outside-the-list",
      need: "unapproved",
      email: "not collected",
    }, storage);
    const saved = JSON.parse(storage.getItem(WIZARD_STORAGE_KEY));

    expect(saved).toMatchObject({ step: 1, city: "toronto", travelRadius: "", need: "" });
    expect(saved.email).toBeUndefined();
  });

  test("requires a yes or no answer for the winter tire follow-up", () => {
    expect(canContinueFromNeed({ need: "winter_changeover", newTires: "" })).toBe(false);
    expect(canContinueFromNeed({ need: "winter_changeover", newTires: "yes" })).toBe(true);
    expect(canContinueFromNeed({ need: "winter_changeover", newTires: "no" })).toBe(true);
  });

  test.each([
    ["buy_2_tires", "", "vehicle_tire_size", false],
    ["buy_4_tires", "", "vehicle_tire_size", false],
    ["winter_changeover", "yes", "vehicle_tire_size", false],
    ["winter_changeover", "no", "changeover_request", false],
    ["repair_inspection", "", "repair_inspection", false],
    ["unsure", "", "vehicle_tire_size", true],
  ])("routes %s / %s to the approved next step", (need, newTires, destination, guidanceNeeded) => {
    expect(getNextStep({ need, newTires })).toMatchObject({ destination, guidanceNeeded });
  });

  test("does not expose a next step until a valid need selection exists", () => {
    expect(getNextStep({ need: "", newTires: "" })).toBeNull();
    expect(getNextStep({ need: "winter_changeover", newTires: "" })).toBeNull();
  });
});
