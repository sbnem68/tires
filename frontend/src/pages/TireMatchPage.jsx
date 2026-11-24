import { useEffect, useReducer } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Seo } from "@/components/site/Seo";
import { useSite } from "@/context/SiteContext";
import {
  canContinueWizard,
  createInitialWizardState,
  getWizardProgress,
  NEED_OPTIONS,
  wizardReducer,
} from "@/lib/tireMatchWizard";

const initialStateFromUrl = (search, previewEnabled, selectedCitySlug) => {
  const params = new URLSearchParams(search);
  const showStepTwoPreview = previewEnabled && params.get("wizard_preview") === "step-2";
  return createInitialWizardState({
    step: showStepTwoPreview ? 2 : 1,
    citySlug: params.get("city") || selectedCitySlug || (showStepTwoPreview ? "toronto" : ""),
    needType: showStepTwoPreview ? "buy_4" : "",
  });
};

const StepHeader = ({ step }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-[hsl(var(--t4t-cta))]">Tire Match</span>
      <span className="text-muted-foreground" data-testid="tire-match-step-label">Step {step} of 2</span>
    </div>
    <div
      className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
      role="progressbar"
      aria-label="Tire Match progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={getWizardProgress(step)}
      data-testid="tire-match-progress"
    >
      <div
        className="h-full rounded-full bg-[hsl(var(--t4t-cta))] transition-[width] duration-300"
        style={{ width: `${getWizardProgress(step)}%` }}
      />
    </div>
  </div>
);

const NoWriteNotice = () => (
  <div
    className="mt-6 flex gap-3 rounded-xl border border-[hsl(var(--t4t-warning-border))] bg-[hsl(var(--t4t-warning-bg))] p-4 text-sm leading-relaxed text-[hsl(var(--t4t-warning-ink))]"
    data-testid="tire-match-no-write-notice"
  >
    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <p>Preview only. Your choices stay in this page and are not saved or sent. No customer profile or lead is created.</p>
  </div>
);

export default function TireMatchPage() {
  const { search } = useLocation();
  const { cities, loading, error, reload, findCity, stateOf, previewEnabled, selectedCitySlug } = useSite();
  const [wizard, dispatch] = useReducer(
    wizardReducer,
    null,
    () => initialStateFromUrl(search, previewEnabled, selectedCitySlug),
  );
  const city = findCity(wizard.citySlug);
  const canContinue = canContinueWizard(wizard);

  // The config is fetched asynchronously, so apply the staging-only screenshot route after it loads.
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (previewEnabled && params.get("wizard_preview") === "step-2" && wizard.step !== 2) {
      dispatch({
        type: "preview-step-two",
        citySlug: params.get("city") || selectedCitySlug || "toronto",
      });
    }
  }, [search, previewEnabled, selectedCitySlug, wizard.step]);

  // If the city API resolves after the page starts, keep the preview seed valid without writing it.
  useEffect(() => {
    if (wizard.step === 2 && !wizard.citySlug && cities.length > 0 && previewEnabled) {
      dispatch({ type: "select-city", citySlug: cities.find((item) => item.slug === "toronto")?.slug || cities[0].slug });
    }
  }, [wizard.step, wizard.citySlug, cities, previewEnabled]);

  if (loading || error) {
    return (
      <PageShell>
        <Seo title="Tire Match" indexable={false} path="/tire-match" />
        <section className="t4t-container py-10 sm:py-16" data-testid={error ? "tire-match-error" : "tire-match-loading"}>
          {error ? (
            <div className="max-w-2xl rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
              <h1 className="font-heading text-2xl font-bold">We couldn’t load locations</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your choices have not been sent or saved.</p>
              <button type="button" onClick={reload} className="t4t-btn-secondary t4t-focus mt-6">Try again</button>
            </div>
          ) : (
            <div className="h-80 max-w-2xl animate-pulse rounded-2xl border bg-muted" />
          )}
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell city={city}>
      <Seo title="Tire Match" indexable={false} path="/tire-match" />
      <section className="t4t-container py-8 sm:py-14" data-testid="tire-match-page">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-9">
            <StepHeader step={wizard.step} />

            {wizard.step === 1 ? (
              <div data-testid="tire-match-step-1">
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-[hsl(var(--t4t-wash-1))] p-2.5 text-[hsl(var(--t4t-cta))]">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl" data-testid="tire-match-title">
                      Where do you need service?
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Choose the city you’d be comfortable visiting for tire service.
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <label htmlFor="tire-match-city" className="text-sm font-semibold">City</label>
                  <select
                    id="tire-match-city"
                    value={wizard.citySlug}
                    onChange={(event) => dispatch({ type: "select-city", citySlug: event.target.value })}
                    className="t4t-focus mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
                    data-testid="tire-match-city-select"
                  >
                    <option value="">Choose a city</option>
                    {cities.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}, {item.province_code} · {stateOf(item) === "live" ? "Available" : "Coming soon"}
                      </option>
                    ))}
                  </select>
                  {city && stateOf(city) !== "live" && (
                    <p className="mt-2 text-sm text-muted-foreground" data-testid="tire-match-city-status">
                      Tire Match requests are not open in {city.name} yet.
                    </p>
                  )}
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "continue" })}
                    disabled={!canContinue}
                    className="t4t-btn-primary t4t-focus w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    data-testid="tire-match-next"
                  >
                    Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div data-testid="tire-match-step-2">
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-[hsl(var(--t4t-wash-1))] p-2.5 text-[hsl(var(--t4t-cta))]">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl" data-testid="tire-match-title">
                      What do you need help with?
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Choose the option that best fits. You can change your location or choice later.
                    </p>
                    {city && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-sm" data-testid="tire-match-selected-city">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {city.name}
                      </p>
                    )}
                  </div>
                </div>

                <fieldset className="mt-7">
                  <legend className="sr-only">Select your tire need</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {NEED_OPTIONS.map((option) => {
                      const selected = wizard.needType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => dispatch({ type: "select-need", needType: option.value })}
                          aria-pressed={selected}
                          className={`t4t-focus flex min-h-[88px] items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
                            selected
                              ? "border-[hsl(var(--t4t-cta))] bg-[hsl(var(--t4t-wash-1))]"
                              : "bg-background hover:bg-muted"
                          }`}
                          data-testid={`tire-match-need-${option.value}`}
                        >
                          <span>
                            <span className="block font-semibold">{option.label}</span>
                            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{option.description}</span>
                          </span>
                          {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "back" })}
                    className="t4t-btn-secondary t4t-focus w-full sm:w-auto"
                    data-testid="tire-match-back"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                  </button>
                  <p className="text-sm text-muted-foreground sm:text-right" data-testid="tire-match-end-of-preview">
                    This preview ends here. No answers have been submitted.
                  </p>
                </div>
              </div>
            )}

            <NoWriteNotice />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
