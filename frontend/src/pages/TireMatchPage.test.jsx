import React, { act } from "react";
import axios from "axios";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { useSite } from "@/context/SiteContext";
import TireMatchPage from "@/pages/TireMatchPage";
import {
  canContinueNeed,
  createInitialWizardState,
  getNeedOutcome,
  outcomeCopy,
  readWizardProgress,
  saveWizardProgress,
  WIZARD_STORAGE_KEY,
} from "@/lib/tireMatchWizard";
import { captureAttribution, clearAttribution, getAttribution, getAttributionRecord, getSelectedCity, setSelectedCity } from "@/lib/attribution";

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

const mockSite = (initialSelectedCitySlug = null) => {
  // Behaves like the real context: selecting a city updates the selected city.
  let selectedCitySlug = initialSelectedCitySlug;
  mockSelectCity = jest.fn((slug) => {
    selectedCitySlug = slug;
  });
  mockReload = jest.fn();
  useSite.mockImplementation(() => ({
    cities,
    loading: false,
    error: false,
    reload: mockReload,
    findCity: (slug) => cities.find((city) => city.slug === slug) || null,
    selectedCitySlug,
    selectCity: mockSelectCity,
    stateOf: () => "coming_soon",
  }));
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

/**
 * Tests 15 and 16 run the page against the real SiteProvider and the real API client (axios).
 * Only the network transport is replaced, by a recorder that answers the two public read
 * endpoints and logs every request the app issues.
 */
const renderWithRealClient = async (entry = "/tire-match") => {
  const actualSite = jest.requireActual("@/context/SiteContext");
  useSite.mockImplementation(actualSite.useSite);
  const requests = [];
  const originalAdapter = axios.defaults.adapter;
  axios.defaults.adapter = async (config) => {
    const method = (config.method || "get").toUpperCase();
    // Compare by path so the test is the same with or without a configured backend origin.
    const url = new URL(config.url, "http://local.test").pathname;
    requests.push({ method, url, hasBody: config.data !== undefined && config.data !== null });
    const data = config.url.endsWith("/public/locations")
      ? { cities: cities.map((city) => ({ ...city, subareas: [] })) }
      : { environment: "production", preview_enabled: false, site_indexing_enabled: false };
    return { data, status: 200, statusText: "OK", headers: {}, config, request: {} };
  };
  const fetchSpy = jest.fn(() => Promise.reject(new Error("fetch must not be used")));
  const beaconSpy = jest.fn(() => true);
  const xhrSpy = jest.spyOn(window.XMLHttpRequest.prototype, "open");
  const originalFetch = global.fetch;
  const originalBeacon = window.navigator.sendBeacon;
  global.fetch = fetchSpy;
  window.navigator.sendBeacon = beaconSpy;

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <actualSite.SiteProvider>
          <TireMatchPage />
        </actualSite.SiteProvider>
      </MemoryRouter>,
    );
  });
  await act(async () => {
    await Promise.resolve();
  });

  const restore = () => {
    axios.defaults.adapter = originalAdapter;
    global.fetch = originalFetch;
    window.navigator.sendBeacon = originalBeacon;
    xhrSpy.mockRestore();
  };
  return { requests, fetchSpy, beaconSpy, xhrSpy, restore };
};

const completeBothSteps = async () => {
  await setValue('[data-testid="city-select"]', "ottawa");
  await setValue('[data-testid="postal-code-input"]', "K1A 0B1");
  await setValue('[data-testid="travel-radius-select"]', "25");
  await click('[data-testid="continue-location"]');
  await click('[data-testid="need-option-repair"] input');
  await setValue('[data-testid="issue-description"]', "Slow leak in the front tire");
  await click('[data-testid="continue-need"]');
  await click('[data-testid="edit-need"]');
  await click('[data-testid="change-need"]');
  await click('[data-testid="need-option-buy_4"] input');
  await click('[data-testid="continue-need"]');
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
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

test("3b. A valid URL city wins over saved progress, and original attribution is unchanged", async () => {
  // First visit: organic landing with no parameters. This is the original attribution.
  window.history.replaceState({}, "", "/toronto");
  captureAttribution();
  const original = getAttribution();
  const originalRecord = JSON.stringify(getAttributionRecord().original);
  expect(original.city).toBeNull();

  // The driver had already saved Toronto progress, on step 2 with a need chosen.
  saveWizardProgress({ step: 2, citySlug: "toronto", postalCode: "M5V 2T6", radius: "25", need: "buy_4" });
  setSelectedCity("toronto");
  mockSite("toronto");

  // Later they arrive with ?city=ottawa.
  await renderPage("/tire-match?city=ottawa");

  expect(container.querySelector('[data-testid="city-select"]').value).toBe("ottawa");
  expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 1 of 6");
  expect(readWizardProgress()).toMatchObject({ citySlug: "ottawa", postalCode: "M5V 2T6", radius: "25", need: "buy_4" });
  expect(mockSelectCity).toHaveBeenCalledWith("ottawa");

  // Original attribution, including the original landing city and landing URL, is untouched.
  expect(getAttribution()).toEqual(original);
  expect(JSON.stringify(getAttributionRecord().original)).toBe(originalRecord);
  expect(getAttribution().landing_url).toContain("/toronto");
});

test("3c. Without a valid URL city, saved progress is used; with neither, no city is selected", async () => {
  saveWizardProgress({ step: 1, citySlug: "toronto" });
  await renderPage("/tire-match?city=gatineau");
  expect(container.querySelector('[data-testid="city-select"]').value).toBe("toronto");
  await act(async () => root.unmount());
  root = null;
  container.remove();

  // A new browser with nothing stored at all.
  window.localStorage.clear();
  window.sessionStorage.clear();
  mockSite();
  await renderPage("/tire-match");
  expect(container.querySelector('[data-testid="city-select"]').value).toBe("");
  expect(container.querySelector('[data-testid="continue-location"]').disabled).toBe(true);
});

test("3d. A manual city change after a URL preselect survives a refresh", async () => {
  await renderPage("/tire-match?city=ottawa");
  expect(container.querySelector('[data-testid="city-select"]').value).toBe("ottawa");
  await setValue('[data-testid="city-select"]', "hamilton");
  await act(async () => root.unmount());

  root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/tire-match?city=ottawa"]}>
        <TireMatchPage />
      </MemoryRouter>,
    );
  });
  expect(container.querySelector('[data-testid="city-select"]').value).toBe("hamilton");
});

test("3e. An explicit city choice on the site outranks a city parameter already applied this session", async () => {
  // The driver landed with ?city=ottawa, then chose Toronto in the city selector. The query
  // string is still carried on internal links, but it must not put Ottawa back.
  const { markUrlCityApplied } = require("@/lib/tireMatchWizard");
  markUrlCityApplied("ottawa");
  setSelectedCity("toronto");
  mockSite("toronto");
  await renderPage("/tire-match?city=ottawa");
  expect(container.querySelector('[data-testid="city-select"]').value).toBe("toronto");
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

test("12. Mobile-first markup: single column, full-width primary action, and no fixed widths", async () => {
  // jsdom has no layout engine, so this test covers markup only. Real viewport behaviour
  // (no horizontal scroll at 390px, tap-target sizes, full-width action on mobile and
  // auto-width on desktop) is measured in a real browser by tests/e2e/checkpoint2_browser.py.
  await renderPage();
  const action = container.querySelector('[data-testid="continue-location"]');
  expect(action.className).toContain("w-full");
  expect(action.className).toContain("sm:w-auto");
  container.querySelectorAll("select, input, textarea").forEach((field) => {
    expect(field.className).toContain("w-full");
    expect(field.className).toContain("min-h-12");
  });
  expect(container.innerHTML).not.toMatch(/(^|[\s"])w-\[\d+px\]/);
  // No more than six fields or choices on the screen.
  expect(container.querySelectorAll("select, input, textarea").length).toBeLessThanOrEqual(6);
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

test("15. No lead is created: no request reaches a lead endpoint and no lead record is stored", async () => {
  window.history.replaceState({}, "", "/tire-match?city=ottawa&utm_source=first");
  captureAttribution();
  const { requests, restore } = await renderWithRealClient("/tire-match?city=ottawa&utm_source=first");
  try {
    await completeBothSteps();

    // Nothing the real API client sent goes anywhere near a lead, request, quote or registration.
    expect(requests.length).toBeGreaterThan(0);
    requests.forEach((request) => {
      expect(request.url).not.toMatch(/lead|request|quote|interest|register|submit|contact/i);
    });
    // The API client exposes no function that could create one.
    const api = jest.requireActual("@/lib/api");
    expect(Object.keys(api).sort()).toEqual(["fetchArchitecture", "fetchHealth", "fetchLocations", "fetchPublicConfig"]);
    // Browser storage holds only attribution, the selected city and wizard progress.
    const keys = Object.keys(window.localStorage).sort();
    expect(keys).toEqual(["t4t.attribution.v1", "t4t.selected_city.v1", WIZARD_STORAGE_KEY].sort());
    expect(JSON.stringify(window.localStorage)).not.toMatch(/lead_id|idempotency|first_name|phone|email/i);
    expect(container.querySelector('[data-testid="next-step-notice"]').textContent).toContain("no request has been created");
  } finally {
    restore();
  }
});

test("16. No server write: the real HTTP client issues only the two read-only GET requests", async () => {
  const { requests, fetchSpy, beaconSpy, xhrSpy, restore } = await renderWithRealClient("/tire-match");
  try {
    await completeBothSteps();
    await click('[data-testid="edit-need"]');
    await click('[data-testid="wizard-back"]');
    await setValue('[data-testid="city-select"]', "toronto");
    await click('[data-testid="continue-location"]');

    // Every request made through axios, the client the app really uses.
    expect(requests.map((request) => `${request.method} ${request.url}`).sort()).toEqual([
      "GET /api/public/config",
      "GET /api/public/locations",
    ]);
    requests.forEach((request) => expect(request.hasBody).toBe(false));
    // And nothing went around axios.
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beaconSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
  } finally {
    restore();
  }
});

test("17. Changing the selected city does not change original attribution", async () => {
  window.history.replaceState({}, "", "/tire-match?city=ottawa&utm_source=first");
  clearAttribution();
  captureAttribution();
  const original = getAttribution();

  await renderPage("/tire-match?city=ottawa&utm_source=first");
  await setValue('[data-testid="city-select"]', "toronto");
  setSelectedCity("toronto");

  expect(getAttribution()).toEqual(original);
  expect(getAttribution().city).toBe("ottawa");
  // The selected city lives under its own key, apart from the original landing city.
  expect(getSelectedCity()).toBe("toronto");
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

test("Driver-facing wording contains no internal development language", async () => {
  expect(outcomeCopy.vehicle_tire_size).toBe("Next: vehicle and tire size (coming soon).");
  await renderPage();
  await goToNeedStep();
  for (const need of ["buy_2", "unsure"]) {
    await click(`[data-testid="need-option-${need}"] input`);
    await click('[data-testid="continue-need"]');
    expect(container.textContent).toContain("Next: vehicle and tire size (coming soon).");
    expect(container.textContent).not.toMatch(/checkpoint|not implemented|todo|not built|are built|outside/i);
    await click('[data-testid="edit-need"]');
  }
  Object.values(outcomeCopy).forEach((copy) => {
    expect(copy).not.toMatch(/checkpoint|not implemented|todo|built|outside/i);
  });
});
