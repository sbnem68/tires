import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { useSite } from "@/context/SiteContext";
import TireMatchPage from "@/pages/TireMatchPage";
import {
  canContinueNeed,
  createInitialWizardState,
  getNeedOutcome,
  readWizardProgress,
  WIZARD_STORAGE_KEY,
} from "@/lib/tireMatchWizard";
import { clearAttribution, getAttribution, setSelectedCity } from "@/lib/attribution";

jest.mock("@/components/site/PageShell", () => ({
  PageShell: ({ children }) => children,
  useCarry: () => (pathname) => ({ pathname }),
}));

jest.mock("@/components/site/Seo", () => ({ Seo: () => null }));

jest.mock("@/context/SiteContext", () => ({ useSite: jest.fn() }));

const cities = [
  { slug: "hamilton", name: "Hamilton", launch_status: "planned" },
  { slug: "ottawa", name: "Ottawa", launch_status: "onboarding" },
  { slug: "toronto", name: "Toronto", launch_status: "planned" },
];

let container;
let root;
let mockSelectCity;
let mockReload;

const mockSite = (selectedCitySlug = null) => {
  mockSelectCity = jest.fn();
  mockReload = jest.fn();
  useSite.mockReturnValue({
    cities,
    loading: false,
    error: false,
    reload: mockReload,
    findCity: (slug) => cities.find((city) => city.slug === slug) || null,
    selectedCitySlug,
    selectCity: mockSelectCity,
    stateOf: () => "coming_soon",
  });
};

const renderPage = async (entry = "/tire-match") => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <TireMatchPage />
      </MemoryRouter>,
    );
  });
  return container;
};

const click = async (selector) => {
  const element = container.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  await act(async () => element.click());
};

const setValue = async (selector, value) => {
  const element = container.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value")?.set;
  await act(async () => {
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
};

const goToNeedStep = async () => {
  await setValue('[data-testid="city-select"]', "ottawa");
  await click('[data-testid="continue-location"]');
};

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
  clearAttribution();
  mockSite();
});

afterEach(async () => {
  if (root) {
    await act(async () => root.unmount());
    root = null;
  }
  if (container?.parentNode) container.parentNode.removeChild(container);
  container = null;
});

test("1. Step 1 loads with the city and location fields", async () => {
  await renderPage();
  expect(container.querySelector('[data-testid="location-step"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="step-heading"]').textContent).toBe("Which city are you in?");
  expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 1 of 6");
});

test("2. City can be selected manually", async () => {
  await renderPage();
  await setValue('[data-testid="city-select"]', "toronto");
  expect(container.querySelector('[data-testid="city-select"]').value).toBe("toronto");
  expect(mockSelectCity).toHaveBeenCalledWith("toronto");
});

test("3. City is preselected from the URL", async () => {
  expect(
    createInitialWizardState({ search: "?city=toronto", selectedCitySlug: "ottawa", savedProgress: null }).citySlug,
  ).toBe("toronto");
  await renderPage("/tire-match?city=toronto");
  expect(container.querySelector('[data-testid="city-select"]').value).toBe("toronto");
  expect(mockSelectCity).toHaveBeenCalledWith("toronto");
});

test("4. Postal code is optional", async () => {
  await renderPage();
  await setValue('[data-testid="city-select"]', "ottawa");
  expect(container.querySelector('[data-testid="postal-code-input"]').value).toBe("");
  expect(container.querySelector('[data-testid="continue-location"]').disabled).toBe(false);
  await click('[data-testid="continue-location"]');
  expect(container.querySelector('[data-testid="need-step"]')).not.toBeNull();
});

test("5. Travel radius can be selected", async () => {
  await renderPage();
  await setValue('[data-testid="travel-radius-select"]', "25");
  expect(container.querySelector('[data-testid="travel-radius-select"]').value).toBe("25");
});

test("6. Step 2 loads after continuing from location", async () => {
  await renderPage();
  await goToNeedStep();
  expect(container.querySelector('[data-testid="step-heading"]').textContent).toBe("What do you need today?");
  expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 2 of 6");
});

test("7. All five need options can be selected", async () => {
  await renderPage();
  await goToNeedStep();

  for (const need of ["buy_2", "buy_4", "changeover", "repair", "unsure"]) {
    await click(`[data-testid="need-option-${need}"] input`);
    if (need === "changeover") {
      expect(container.querySelector('[data-testid="winter-question"]')).not.toBeNull();
      expect(container.querySelectorAll('[data-testid="winter-question"] input[type="radio"]')).toHaveLength(2);
      await click('[data-testid="change-need"]');
    } else if (need === "repair") {
      expect(container.querySelector('[data-testid="issue-description"]')).not.toBeNull();
      await click('[data-testid="change-need"]');
    } else {
      expect(container.querySelector(`[data-testid="need-option-${need}"] input`).checked).toBe(true);
    }
  }
});

test("8. Each need type resolves to its correct next route", () => {
  const cases = [
    [{ need: "buy_2" }, "vehicle_tire_size"],
    [{ need: "buy_4" }, "vehicle_tire_size"],
    [{ need: "changeover", winterNeedsNewTires: true }, "vehicle_tire_size"],
    [{ need: "changeover", winterNeedsNewTires: false }, "changeover_request"],
    [{ need: "repair", issueDescription: "Slow leak" }, "repair_inspection"],
    [{ need: "unsure" }, "guidance_needed"],
  ];

  cases.forEach(([state, outcome]) => {
    expect(canContinueNeed(state)).toBe(true);
    expect(getNeedOutcome(state)).toBe(outcome);
  });
  expect(canContinueNeed({ need: "repair", issueDescription: "   " })).toBe(false);
});

test("9. Back navigation keeps the user's selections", async () => {
  await renderPage();
  await setValue('[data-testid="city-select"]', "ottawa");
  await setValue('[data-testid="postal-code-input"]', "K1A 0B1");
  await setValue('[data-testid="travel-radius-select"]', "25");
  await click('[data-testid="continue-location"]');
  await click('[data-testid="need-option-buy_4"] input');
  await click('[data-testid="wizard-back"]');

  expect(container.querySelector('[data-testid="city-select"]').value).toBe("ottawa");
  expect(container.querySelector('[data-testid="postal-code-input"]').value).toBe("K1A 0B1");
  expect(container.querySelector('[data-testid="travel-radius-select"]').value).toBe("25");
  await click('[data-testid="continue-location"]');
  expect(container.querySelector('[data-testid="need-option-buy_4"] input').checked).toBe(true);
});

test("10. The progress indicator changes from step 1 to step 2", async () => {
  await renderPage();
  expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 1 of 6");
  await goToNeedStep();
  expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 2 of 6");
  expect(container.querySelector('[role="progressbar"]').getAttribute("aria-valuenow")).toBe("2");
});

test("11. Partial progress is saved in local storage", async () => {
  await renderPage();
  await setValue('[data-testid="city-select"]', "hamilton");
  await setValue('[data-testid="postal-code-input"]', "L8P 1A1");
  await setValue('[data-testid="travel-radius-select"]', "50");
  await click('[data-testid="continue-location"]');

  const saved = readWizardProgress();
  expect(window.localStorage.getItem(WIZARD_STORAGE_KEY)).not.toBeNull();
  expect(saved).toMatchObject({
    step: 2,
    citySlug: "hamilton",
    postalCode: "L8P 1A1",
    radius: "50",
  });
});

test("12. The layout includes mobile-first sizing and a stacked mobile action", async () => {
  await renderPage();
  expect(container.querySelector("section").className).toContain("py-8");
  expect(container.querySelector('[data-testid="continue-location"]').className).toContain("w-full");
  expect(container.querySelector('[data-testid="continue-location"]').className).toContain("sm:w-auto");
});

test("13. Saved progress is restored after a refresh", async () => {
  await renderPage();
  await setValue('[data-testid="city-select"]', "toronto");
  await setValue('[data-testid="postal-code-input"]', "M5V 2T6");
  await click('[data-testid="continue-location"]');
  await click('[data-testid="need-option-buy_2"] input');
  await act(async () => root.unmount());

  root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/tire-match"]}>
        <TireMatchPage />
      </MemoryRouter>,
    );
  });

  expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 2 of 6");
  expect(container.querySelector('[data-testid="need-option-buy_2"] input').checked).toBe(true);
  expect(readWizardProgress().postalCode).toBe("M5V 2T6");
});

test("14. No customer contact information fields are present", async () => {
  await renderPage();
  expect(container.querySelector('input[type="email"], input[type="tel"], input[name*="email"], input[name*="phone"]')).toBeNull();
});

test("15. No lead or request record is created", async () => {
  await renderPage();
  await setValue('[data-testid="city-select"]', "ottawa");
  await click('[data-testid="continue-location"]');
  await click('[data-testid="need-option-buy_4"] input');
  await click('[data-testid="continue-need"]');

  expect(window.localStorage.getItem("lead")).toBeNull();
  expect(window.localStorage.getItem("t4t.leads")).toBeNull();
  expect(container.querySelector('[data-testid="next-step-notice"]').textContent).toContain("no request has been created");
});

test("16. Continuing the wizard does not issue a server write", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn();
  try {
    await renderPage();
    await setValue('[data-testid="city-select"]', "ottawa");
    await click('[data-testid="continue-location"]');
    await click('[data-testid="need-option-buy_4"] input');
    await click('[data-testid="continue-need"]');
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});

test("17. Changing the selected city does not change original attribution", async () => {
  window.history.replaceState({}, "", "/tire-match?city=ottawa&utm_source=first");
  clearAttribution();
  const { captureAttribution } = require("@/lib/attribution");
  captureAttribution();
  const original = getAttribution();

  await renderPage("/tire-match?city=ottawa&utm_source=first");
  await setValue('[data-testid="city-select"]', "toronto");
  setSelectedCity("toronto");

  expect(getAttribution()).toEqual(original);
  expect(getAttribution().city).toBe("ottawa");
});

test("18. Original attribution remains locked for later touches within 30 days", () => {
  const loadFreshAttribution = () => {
    let module;
    jest.isolateModules(() => {
      module = require("@/lib/attribution");
    });
    return module;
  };

  window.history.replaceState({}, "", "/tire-match?city=ottawa&utm_source=first");
  const firstVisit = loadFreshAttribution();
  firstVisit.clearAttribution();
  firstVisit.captureAttribution();

  window.history.replaceState({}, "", "/tire-match?city=toronto&utm_source=second");
  const laterVisit = loadFreshAttribution();
  laterVisit.captureAttribution();

  expect(laterVisit.getAttribution().city).toBe("ottawa");
  expect(laterVisit.getAttribution().utm_source).toBe("first");
  expect(laterVisit.getAttributionRecord().last_touch.utm_source).toBe("second");
});
