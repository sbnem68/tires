export const NEED_OPTIONS = [
  { value: "buy_2", label: "Buy 2 tires", description: "I need two replacement tires." },
  { value: "buy_4", label: "Buy 4 tires", description: "I need a complete set of four." },
  { value: "changeover", label: "Seasonal changeover", description: "I have tires and need them changed." },
  { value: "repair", label: "Repair a tire", description: "I need help with a damaged tire." },
  { value: "not_sure", label: "I’m not sure yet", description: "Help me figure out what I need." },
];

export const createInitialWizardState = (overrides = {}) => ({
  step: 1,
  citySlug: "",
  needType: "",
  ...overrides,
});

export const wizardReducer = (state, action) => {
  switch (action.type) {
    case "select-city":
      return { ...state, citySlug: action.citySlug };
    case "select-need":
      return NEED_OPTIONS.some((option) => option.value === action.needType)
        ? { ...state, needType: action.needType }
        : state;
    case "preview-step-two":
      return { ...state, step: 2, citySlug: action.citySlug || state.citySlug || "toronto", needType: "buy_4" };
    case "continue":
      return state.step === 1 && state.citySlug ? { ...state, step: 2 } : state;
    case "back":
      return state.step === 2 ? { ...state, step: 1 } : state;
    case "reset":
      return createInitialWizardState();
    default:
      return state;
  }
};

export const canContinueWizard = (state) => state.step === 1 && Boolean(state.citySlug);

export const getWizardProgress = (step) => (step === 2 ? 100 : 50);
