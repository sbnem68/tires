import {
  canContinueWizard,
  createInitialWizardState,
  getWizardProgress,
  NEED_OPTIONS,
  wizardReducer,
} from "./tireMatchWizard";

const advance = (state) => wizardReducer(state, { type: "continue" });
const chooseCity = (state, citySlug = "toronto") => wizardReducer(state, { type: "select-city", citySlug });
const onStepTwo = (overrides = {}) => createInitialWizardState({ step: 2, citySlug: "toronto", ...overrides });

describe("Checkpoint 2 Tire Match wizard", () => {
  test("starts on Step 1 with no answers", () => {
    expect(createInitialWizardState()).toEqual({ step: 1, citySlug: "", needType: "" });
  });

  test("starts at the first-step progress value", () => {
    expect(getWizardProgress(1)).toBe(50);
  });

  test("shows two-step progress as complete on Step 2", () => {
    expect(getWizardProgress(2)).toBe(100);
  });

  test("requires a city before continuing", () => {
    expect(canContinueWizard(createInitialWizardState())).toBe(false);
  });

  test("a chosen city enables Step 1 continuation", () => {
    expect(canContinueWizard(chooseCity(createInitialWizardState()))).toBe(true);
  });

  test("cannot continue from Step 1 without a city", () => {
    const state = createInitialWizardState();
    expect(advance(state)).toBe(state);
  });

  test("continues after city selection and supports the staging Step 2 preview", () => {
    expect(advance(chooseCity(createInitialWizardState())).step).toBe(2);
    expect(wizardReducer(createInitialWizardState(), { type: "preview-step-two" }))
      .toMatchObject({ step: 2, citySlug: "toronto", needType: "buy_4" });
  });

  test("keeps the selected city when continuing", () => {
    expect(advance(chooseCity(createInitialWizardState(), "ottawa")).citySlug).toBe("ottawa");
  });

  test("allows the city to be changed on Step 1", () => {
    const state = chooseCity(chooseCity(createInitialWizardState(), "ottawa"), "hamilton");
    expect(state.citySlug).toBe("hamilton");
  });

  test("offers exactly the five supported need types", () => {
    expect(NEED_OPTIONS.map((option) => option.value)).toEqual([
      "buy_2", "buy_4", "changeover", "repair", "not_sure",
    ]);
  });

  test("selects a supported need type", () => {
    expect(wizardReducer(onStepTwo(), { type: "select-need", needType: "buy_2" }).needType).toBe("buy_2");
  });

  test("changes the selected need type", () => {
    const state = wizardReducer(onStepTwo({ needType: "buy_2" }), { type: "select-need", needType: "repair" });
    expect(state.needType).toBe("repair");
  });

  test("ignores an unsupported need type", () => {
    const state = onStepTwo();
    expect(wizardReducer(state, { type: "select-need", needType: "sell_tires" })).toBe(state);
  });

  test("accepts every supported need choice", () => {
    const choices = NEED_OPTIONS.map(({ value }) =>
      wizardReducer(onStepTwo(), { type: "select-need", needType: value }).needType,
    );
    expect(choices).toEqual(NEED_OPTIONS.map(({ value }) => value));
  });

  test("can return to Step 1 from Step 2", () => {
    expect(wizardReducer(onStepTwo(), { type: "back" }).step).toBe(1);
  });

  test("keeps the selected need while going back", () => {
    const state = wizardReducer(onStepTwo({ needType: "changeover" }), { type: "back" });
    expect(state.needType).toBe("changeover");
  });

  test("does not advance beyond the Checkpoint 2 scope", () => {
    const state = onStepTwo({ needType: "buy_4" });
    expect(advance(state)).toBe(state);
    expect(canContinueWizard(state)).toBe(false);
  });

  test("resets only in-memory wizard answers", () => {
    expect(wizardReducer(onStepTwo({ needType: "repair" }), { type: "reset" }))
      .toEqual({ step: 1, citySlug: "", needType: "" });
  });
});
