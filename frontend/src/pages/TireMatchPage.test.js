import React, { act } from "react";
import { createRoot } from "react-dom/client";
import TireMatchPage from "@/pages/TireMatchPage";
import { useSite } from "@/context/SiteContext";
import { getAttribution, getAttributionRecord } from "@/lib/attribution";
import { NEED_OPTIONS, WIZARD_STORAGE_KEY } from "@/lib/tireMatchWizard";

jest.mock("@/context/SiteContext", () => ({ useSite: jest.fn() }));
jest.mock("react-router-dom", () => {
  const ReactRuntime = require("react");
  return {
    Link: ({ to, children, ...props }) => ReactRuntime.createElement(
      "a",
      { ...props, href: typeof to === "string" ? to : to.pathname },
      children,
    ),
    useLocation: () => ({ search: globalThis.location.search }),
  };
});
jest.mock("@/components/site/PageShell", () => ({
  PageShell: ({ children }) => children,
  useCarry: () => (pathname) => ({ pathname, search: "" }),
}));
jest.mock("@/components/site/Seo", () => ({ Seo: () => null }));

const cities = [
  { slug: "ottawa", name: "Ottawa", launch_status: "onboarding" },
  { slug: "toronto", name: "Toronto", launch_status: "planned" },
  { slug: "hamilton", name: "Hamilton", launch_status: "planned" },
];

let lastMount;

const mountPage = (entry = "/tire-match") => {
  window.history.replaceState({}, "", entry);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<TireMatchPage />);
  });
  lastMount = {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
  return lastMount;
};

const changeValue = (element, value) => {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
};

const click = (element) => act(() => element.click());

const goToStepTwo = (container, city = "ottawa") => {
  changeValue(container.querySelector('[data-testid="wizard-city"]'), city);
  click(container.querySelector('[data-testid="wizard-step-one-continue"]'));
};

beforeEach(() => {
  localStorage.clear();
  useSite.mockReturnValue({
    cities,
    loading: false,
    error: false,
    reload: jest.fn(),
    findCity: (slug) => cities.find((city) => city.slug === slug) || null,
    selectedCitySlug: "",
    selectCity: jest.fn(),
    previewEnabled: false,
  });
  global.fetch = jest.fn();
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  lastMount?.unmount();
  lastMount = null;
  delete global.fetch;
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

describe("Tire Match Steps 1 and 2", () => {
  test("loads Step 1 with database-provided cities", () => {
    const { container } = mountPage();
    expect(container.querySelector("h2").textContent).toBe("Which city are you in?");
    expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 1 of 6");
    expect(Array.from(container.querySelectorAll('[data-testid="wizard-city"] option')).map((option) => option.value))
      .toEqual(["", "ottawa", "toronto", "hamilton"]);
  });

  test("allows manual city selection and stores it separately from attribution", () => {
    const { container } = mountPage();
    const citySelect = container.querySelector('[data-testid="wizard-city"]');
    changeValue(citySelect, "toronto");

    expect(citySelect.value).toBe("toronto");
    expect(useSite.mock.results[0].value.selectCity).toHaveBeenCalledWith("toronto");
    expect(JSON.parse(localStorage.getItem(WIZARD_STORAGE_KEY)).city).toBe("toronto");
  });

  test.each(["ottawa", "toronto", "hamilton"])("preselects URL city %s", (city) => {
    const { container } = mountPage(`/tire-match?city=${city}`);
    expect(container.querySelector('[data-testid="wizard-city"]').value).toBe(city);
  });

  test("keeps postal code optional and allows continuing without one", () => {
    const { container } = mountPage();
    goToStepTwo(container);
    expect(container.querySelector('[data-testid="wizard-step-two"]')).not.toBeNull();
  });

  test("allows selecting a travel radius", () => {
    const { container } = mountPage();
    const radius = container.querySelector('[data-testid="wizard-travel-radius"]');
    changeValue(radius, "25km");
    expect(radius.value).toBe("25km");
    expect(JSON.parse(localStorage.getItem(WIZARD_STORAGE_KEY)).travelRadius).toBe("25km");
  });

  test("loads Step 2 with the correct heading and progress", () => {
    const { container } = mountPage();
    goToStepTwo(container);
    expect(container.querySelector("h2").textContent).toBe("What do you need today?");
    expect(container.querySelector('[data-testid="wizard-progress-label"]').textContent).toBe("Step 2 of 6");
    expect(container.querySelector('[data-testid="wizard-progress"]').getAttribute("aria-valuenow")).toBe("2");
  });

  test("renders all five selectable need options", () => {
    const { container } = mountPage();
    goToStepTwo(container);
    expect(container.querySelectorAll('[data-testid^="wizard-need-option-"]').length).toBe(5);
    NEED_OPTIONS.forEach((option) => {
      expect(container.querySelector(`[data-testid="wizard-need-option-${option.value}"]`).textContent)
        .toContain(option.label);
    });
  });

  test("shows the winter follow-up and routes a no-new-tires answer as changeover", () => {
    const { container } = mountPage();
    goToStepTwo(container);
    click(container.querySelector('[data-testid="wizard-need-option-winter_changeover"] input'));
    expect(container.querySelector('[data-testid="wizard-winter-followup"]')).not.toBeNull();
    click(container.querySelector('[data-testid="wizard-new-tires-no"]'));
    click(container.querySelector('[data-testid="wizard-step-two-continue"]'));
    expect(container.querySelector('[data-testid="wizard-next-step"]').dataset.nextStep).toBe("changeover_request");
  });

  test("keeps selections when moving back to Step 1", () => {
    const { container } = mountPage();
    changeValue(container.querySelector('[data-testid="wizard-city"]'), "hamilton");
    changeValue(container.querySelector('[data-testid="wizard-postal-code"]'), "L8P 1A1");
    changeValue(container.querySelector('[data-testid="wizard-travel-radius"]'), "50km");
    click(container.querySelector('[data-testid="wizard-step-one-continue"]'));
    click(container.querySelector('[data-testid="wizard-need-option-buy_4_tires"] input'));
    click(container.querySelector('[data-testid="wizard-back-to-step-one"]'));

    expect(container.querySelector('[data-testid="wizard-city"]').value).toBe("hamilton");
    expect(container.querySelector('[data-testid="wizard-postal-code"]').value).toBe("L8P 1A1");
    expect(container.querySelector('[data-testid="wizard-travel-radius"]').value).toBe("50km");
  });

  test("restores the step and answers after a simulated refresh", () => {
    let mount = mountPage("/tire-match?city=ottawa");
    goToStepTwo(mount.container);
    click(mount.container.querySelector('[data-testid="wizard-need-option-buy_2_tires"] input'));
    mount.unmount();

    mount = mountPage("/tire-match?city=ottawa");
    expect(mount.container.querySelector('[data-testid="wizard-step-two"]')).not.toBeNull();
    expect(mount.container.querySelector('[data-testid="wizard-need-option-buy_2_tires"] input').checked).toBe(true);
    mount.unmount();
  });

  test("uses a mobile-first layout without fixed-width controls", () => {
    const { container } = mountPage();
    const city = container.querySelector('[data-testid="wizard-city"]');
    const grid = container.querySelector('[data-testid="wizard-step-one"] .grid');
    expect(city.className).toContain("w-full");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).not.toMatch(/(?:^|\s)grid-cols-[2-9]/);
  });

  test("does not render contact fields, create a lead, or send a request", () => {
    const { container } = mountPage();
    goToStepTwo(container);
    click(container.querySelector('[data-testid="wizard-need-option-buy_2_tires"] input'));
    click(container.querySelector('[data-testid="wizard-step-two-continue"]'));

    expect(container.querySelector('input[type="email"], input[type="tel"]')).toBeNull();
    expect(container.querySelector('[data-testid="wizard-next-step"]').textContent).not.toMatch(/lead created/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("does not change the original attribution when the selected city changes", () => {
    const original = { city: "ottawa", utm_source: "campaign-a" };
    localStorage.setItem("t4t.attribution.v1", JSON.stringify({ original, original_meta: {}, original_has_params: true }));
    const { container } = mountPage();
    changeValue(container.querySelector('[data-testid="wizard-city"]'), "toronto");

    expect(getAttribution()).toMatchObject(original);
    expect(getAttributionRecord().original.city).toBe("ottawa");
  });
});
