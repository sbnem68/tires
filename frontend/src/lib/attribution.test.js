const setUrl = (path) => window.history.replaceState({}, "", path);
const freshAttributionModule = () => {
  jest.resetModules();
  return require("@/lib/attribution");
};

describe("original landing attribution", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-24T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("keeps the first landing locked for 30 days and records a later touch separately", () => {
    setUrl("/ottawa?city=ottawa&utm_source=first-campaign&source=ad");
    let attribution = freshAttributionModule();
    attribution.captureAttribution();
    const firstRecord = attribution.getAttributionRecord();

    jest.setSystemTime(new Date("2026-12-20T12:00:00.000Z"));
    setUrl("/toronto?city=toronto&utm_source=second-campaign&source=search");
    attribution = freshAttributionModule();
    attribution.captureAttribution();

    const updated = attribution.getAttributionRecord();
    expect(updated.original).toEqual(firstRecord.original);
    expect(updated.original_meta).toEqual(firstRecord.original_meta);
    expect(updated.last_touch.utm_source).toBe("second-campaign");
    expect(updated.original.city).toBe("ottawa");
  });

  test("keeps an organic first landing as the original record", () => {
    setUrl("/ottawa");
    let attribution = freshAttributionModule();
    attribution.captureAttribution();
    const firstRecord = attribution.getAttributionRecord();

    jest.setSystemTime(new Date("2026-11-25T12:00:00.000Z"));
    setUrl("/toronto?city=toronto&utm_source=follow-up");
    attribution = freshAttributionModule();
    attribution.captureAttribution();

    const updated = attribution.getAttributionRecord();
    expect(updated.original).toEqual(firstRecord.original);
    expect(updated.original_meta).toEqual(firstRecord.original_meta);
    expect(updated.original_meta.landing_path_city).toBe("ottawa");
    expect(updated.last_touch.utm_source).toBe("follow-up");
  });

  test("starts a new original touch after the 30-day lock expires", () => {
    setUrl("/ottawa?city=ottawa&utm_source=first");
    let attribution = freshAttributionModule();
    attribution.captureAttribution();

    jest.setSystemTime(new Date("2027-01-01T12:00:00.001Z"));
    setUrl("/toronto?city=toronto&utm_source=after-lock");
    attribution = freshAttributionModule();
    attribution.captureAttribution();

    expect(attribution.getAttributionRecord().original.utm_source).toBe("after-lock");
    expect(attribution.getAttributionRecord().last_touch).toBeNull();
  });
});
