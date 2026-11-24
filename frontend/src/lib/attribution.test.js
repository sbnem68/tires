const DAY_MS = 24 * 60 * 60 * 1000;

const loadAttribution = () => {
  let attribution;
  jest.isolateModules(() => {
    attribution = require("@/lib/attribution");
  });
  return attribution;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-24T12:00:00.000Z"));
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  jest.useRealTimers();
  window.localStorage.clear();
});

test("keeps an organic first landing as the original during the 30-day lock", () => {
  const firstVisit = loadAttribution();
  firstVisit.captureAttribution();
  const original = firstVisit.getAttribution();

  jest.setSystemTime(new Date(Date.now() + 29 * DAY_MS));
  window.history.replaceState({}, "", "/toronto?city=toronto&utm_source=followup&shop=shop-2");
  const laterVisit = loadAttribution();
  laterVisit.captureAttribution();

  expect(laterVisit.getAttribution()).toEqual(original);
  expect(laterVisit.getAttributionRecord().last_touch).toMatchObject({
    city: "toronto",
    utm_source: "followup",
    shop: "shop-2",
  });
});

test("keeps all original attribution fields intact for 30 days", () => {
  window.history.replaceState(
    {},
    "",
    "/ottawa?city=ottawa&source=partner&campaign=fall&shop=shop-1&package=full&price=quoted"
      + "&utm_source=first&utm_medium=email&utm_campaign=launch",
  );
  const firstVisit = loadAttribution();
  firstVisit.captureAttribution();
  const original = firstVisit.getAttribution();

  jest.setSystemTime(new Date(Date.now() + 29 * DAY_MS));
  window.history.replaceState({}, "", "/toronto?city=toronto&utm_source=second");
  const laterVisit = loadAttribution();
  laterVisit.captureAttribution();

  expect(laterVisit.getAttribution()).toEqual(original);
  expect(laterVisit.getAttributionRecord().last_touch.utm_source).toBe("second");
});

test("starts a new original touch after the 30-day lock expires", () => {
  window.history.replaceState({}, "", "/ottawa?city=ottawa&utm_source=first");
  const firstVisit = loadAttribution();
  firstVisit.captureAttribution();

  jest.setSystemTime(new Date(Date.now() + 31 * DAY_MS));
  window.history.replaceState({}, "", "/toronto?city=toronto&utm_source=second");
  const laterVisit = loadAttribution();
  laterVisit.captureAttribution();

  expect(laterVisit.getAttribution().city).toBe("toronto");
  expect(laterVisit.getAttribution().utm_source).toBe("second");
  expect(laterVisit.getAttributionRecord().last_touch).toBeNull();
});
