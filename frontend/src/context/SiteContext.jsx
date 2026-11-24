import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchLocations, fetchPublicConfig } from "@/lib/api";
import { getSelectedCity, setSelectedCity } from "@/lib/attribution";

const SiteContext = createContext(null);
const PREVIEW_KEY = "t4t.preview_state";
export const LAUNCH_STATES = ["live", "planned", "onboarding", "paused"];

/** What the public sees for a launch status. Planned and onboarding look identical publicly. */
export const publicState = (status) => {
  if (status === "live") return "live";
  if (status === "paused") return "paused";
  return "coming_soon";
};

const readInitialPreview = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("preview_state");
    if (fromUrl === "actual") {
      window.sessionStorage.removeItem(PREVIEW_KEY);
      return null;
    }
    if (LAUNCH_STATES.includes(fromUrl)) {
      window.sessionStorage.setItem(PREVIEW_KEY, fromUrl);
      return fromUrl;
    }
    const stored = window.sessionStorage.getItem(PREVIEW_KEY);
    return LAUNCH_STATES.includes(stored) ? stored : null;
  } catch (e) {
    return null;
  }
};

export const SiteProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestedPreview, setRequestedPreview] = useState(readInitialPreview);
  const [selectedCitySlug, setSelectedCitySlug] = useState(getSelectedCity);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [interestCity, setInterestCity] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([fetchPublicConfig(), fetchLocations()])
      .then(([cfg, list]) => {
        setConfig(cfg);
        setCities(list);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const previewEnabled = Boolean(config?.preview_enabled);
  // The preview override only ever applies where the API says review tools are enabled (staging).
  const previewState = previewEnabled ? requestedPreview : null;

  const setPreviewState = useCallback((state) => {
    const next = LAUNCH_STATES.includes(state) ? state : null;
    try {
      if (next) window.sessionStorage.setItem(PREVIEW_KEY, next);
      else window.sessionStorage.removeItem(PREVIEW_KEY);
    } catch (e) {
      /* ignore */
    }
    setRequestedPreview(next);
  }, []);

  const selectCity = useCallback((slug) => {
    setSelectedCity(slug);
    setSelectedCitySlug(slug);
  }, []);

  const value = useMemo(() => {
    const statusOf = (city) => previewState || city.launch_status;
    return {
      config,
      cities,
      loading,
      error,
      reload: load,
      previewEnabled,
      previewState,
      setPreviewState,
      statusOf,
      stateOf: (city) => publicState(statusOf(city)),
      findCity: (slug) => cities.find((c) => c.slug === (slug || "").toLowerCase()) || null,
      selectedCitySlug,
      selectCity,
      selectorOpen,
      openSelector: () => setSelectorOpen(true),
      setSelectorOpen,
      interestCity,
      openInterest: (city) => setInterestCity(city),
      closeInterest: () => setInterestCity(null),
    };
  }, [config, cities, loading, error, load, previewEnabled, previewState, setPreviewState, selectedCitySlug, selectCity, selectorOpen, interestCity]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export const useSite = () => useContext(SiteContext);
