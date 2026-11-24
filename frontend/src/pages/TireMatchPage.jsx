import { useEffect, useReducer, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { PageShell, useCarry } from "@/components/site/PageShell";
import { Seo } from "@/components/site/Seo";
import VehicleTireStep from "@/components/site/VehicleTireStep";
import { useSite } from "@/context/SiteContext";
import {
  canContinueLocation,
  canContinueNeed,
  createInitialWizardState,
  markUrlCityApplied,
  NEED_OPTIONS,
  outcomeCopy,
  RADIUS_OPTIONS,
  resolveInitialCity,
  saveWizardProgress,
  wizardReducer,
} from "@/lib/tireMatchWizard";

const FieldLabel = ({ htmlFor, children, optional = false }) => (
  <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">
    {children}
    {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
  </label>
);

const WizardProgress = ({ step }) => (
  <div className="mb-8" data-testid="wizard-progress">
    <div className="mb-2 flex items-center justify-between gap-4">
      <span className="text-sm font-semibold" data-testid="wizard-progress-label">Step {step} of 6</span>
    </div>
    <div
      role="progressbar"
      aria-label="Intake progress"
      aria-valuemin="1"
      aria-valuemax="6"
      aria-valuenow={step}
      className="h-2 overflow-hidden rounded-full bg-secondary"
    >
      <div
        className="h-full rounded-full bg-[hsl(var(--t4t-cta))] transition-all"
        style={{ width: `${(step / 6) * 100}%` }}
      />
    </div>
  </div>
);

const ChoiceCard = ({ checked, label, name, onChange, value, testId }) => (
  <label
    className={`t4t-focus flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
      checked ? "border-[hsl(var(--t4t-cta))] bg-[hsl(var(--t4t-wash-1))]" : "bg-card hover:bg-muted"
    }`}
    data-testid={testId}
  >
    <input
      className="h-4 w-4 accent-[hsl(var(--t4t-cta))]"
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={() => onChange(value)}
    />
    <span className="font-medium">{label}</span>
  </label>
);

export default function TireMatchPage() {
  const { cities, loading, error, reload, findCity, selectedCitySlug, selectCity, stateOf } = useSite();
  const { search } = useLocation();
  const carry = useCarry();
  const initializedRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const [state, dispatch] = useReducer(wizardReducer, null, () => createInitialWizardState({ search }));
  const city = findCity(state.citySlug);

  // Strict precedence: URL city, then saved wizard progress, then nothing selected.
  // The city chosen elsewhere on the site is deliberately not consulted.
  useEffect(() => {
    if (loading || error || initializedRef.current) return;
    const resolved = resolveInitialCity({ state, cities, search });
    const initialCity = resolved.citySlug;
    dispatch({ type: "hydrate-city", value: initialCity, returnToLocation: resolved.returnToLocation });
    // Selected city only. The original attribution record (landing city included) is not touched.
    if (resolved.source === "url") markUrlCityApplied(initialCity);
    if (initialCity && initialCity !== selectedCitySlug) selectCity(initialCity);
    initializedRef.current = true;
    setInitialized(true);
  }, [cities, error, loading, search, selectCity, selectedCitySlug, state]);

  useEffect(() => {
    if (initialized) saveWizardProgress(state);
  }, [initialized, state]);

  const chooseCity = (slug) => {
    dispatch({ type: "set-city", value: slug });
    if (slug) selectCity(slug);
  };

  const continueLocation = (event) => {
    event.preventDefault();
    dispatch({ type: "continue-location" });
  };

  const continueNeed = (event) => {
    event.preventDefault();
    dispatch({ type: "continue-need" });
  };

  return (
    <PageShell city={city}>
      <Seo title="Tire Match" indexable={false} path="/tire-match" />
      <section className="t4t-container py-8 sm:py-14" data-testid="tire-match-page">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              to={carry(city ? `/${city.slug}` : "/")}
              className="t4t-focus inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              data-testid="tire-match-back-link"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Exit intake
            </Link>
            {city && stateOf(city) !== "live" && (
              <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground" data-testid="city-status-note">
                Not open for requests yet
              </span>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-9">
            <WizardProgress step={state.step} />

            {loading && (
              <div className="py-8 text-center text-sm text-muted-foreground" role="status" data-testid="wizard-loading">
                Loading available cities…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-[hsl(var(--t4t-warning-border))] bg-[hsl(var(--t4t-warning-bg))] p-4" role="alert" data-testid="wizard-load-error">
                <p className="font-semibold">We couldn’t load the available cities.</p>
                <p className="mt-1 text-sm">Please try again. Your information has not been sent.</p>
                <button type="button" onClick={reload} className="t4t-btn-secondary mt-4 min-h-11 px-4 text-sm">
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && initialized && state.step === 1 && (
              <form onSubmit={continueLocation} data-testid="location-step">
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--t4t-cta))]">Your location</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" data-testid="step-heading">
                    Which city are you in?
                  </h1>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    Choose the city where you would like tire service.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <FieldLabel htmlFor="wizard-city">City</FieldLabel>
                    <select
                      id="wizard-city"
                      className="t4t-focus min-h-12 w-full rounded-xl border bg-background px-3 text-base"
                      value={state.citySlug}
                      onChange={(event) => chooseCity(event.target.value)}
                      required
                      data-testid="city-select"
                    >
                      <option value="">Choose a city</option>
                      {cities.map((availableCity) => (
                        <option key={availableCity.slug} value={availableCity.slug}>{availableCity.name}</option>
                      ))}
                    </select>
                    {cities.length === 0 && (
                      <p className="mt-2 text-sm text-muted-foreground" data-testid="no-cities-message">
                        No cities are available yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <FieldLabel htmlFor="wizard-postal" optional>Postal code</FieldLabel>
                    <input
                      id="wizard-postal"
                      type="text"
                      autoComplete="postal-code"
                      inputMode="text"
                      maxLength={10}
                      value={state.postalCode}
                      onChange={(event) => dispatch({ type: "set-postal", value: event.target.value })}
                      placeholder="Example: K1A 0B1"
                      className="t4t-focus min-h-12 w-full rounded-xl border bg-background px-3 text-base"
                      data-testid="postal-code-input"
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="wizard-radius" optional>How far can you travel?</FieldLabel>
                    <select
                      id="wizard-radius"
                      className="t4t-focus min-h-12 w-full rounded-xl border bg-background px-3 text-base"
                      value={state.radius}
                      onChange={(event) => dispatch({ type: "set-radius", value: event.target.value })}
                      data-testid="travel-radius-select"
                    >
                      <option value="">Choose a travel radius</option>
                      {RADIUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Your progress is saved on this device only. Nothing is submitted.
                  </p>
                  <button
                    type="submit"
                    className="t4t-btn-primary w-full sm:w-auto"
                    disabled={!canContinueLocation(state)}
                    data-testid="continue-location"
                  >
                    Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}

            {!loading && !error && initialized && state.step === 2 && (
              <form onSubmit={continueNeed} data-testid="need-step">
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "back" })}
                    className="t4t-focus -ml-2 mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    data-testid="wizard-back"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                  </button>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--t4t-cta))]">Your tire needs</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" data-testid="step-heading">
                    What do you need today?
                  </h1>
                </div>

                {(state.need === "changeover" || state.need === "repair") ? (
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-secondary/60 p-3" data-testid="selected-need-summary">
                    <span className="text-sm font-medium">
                      Selected: {NEED_OPTIONS.find((option) => option.value === state.need)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "set-need", value: "" })}
                      className="t4t-focus min-h-10 rounded-lg px-2 text-sm font-semibold underline underline-offset-4"
                      data-testid="change-need"
                    >
                      Change selection
                    </button>
                  </div>
                ) : (
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">Choose one option</legend>
                    <div className="space-y-3">
                      {NEED_OPTIONS.map((option) => (
                        <ChoiceCard
                          key={option.value}
                          name="tire-need"
                          value={option.value}
                          label={option.label}
                          checked={state.need === option.value}
                          onChange={(value) => dispatch({ type: "set-need", value })}
                          testId={`need-option-${option.value}`}
                        />
                      ))}
                    </div>
                  </fieldset>
                )}

                {state.need === "changeover" && (
                  <fieldset className="mt-6 rounded-xl border bg-secondary/60 p-4" data-testid="winter-question">
                    <legend className="px-1 text-sm font-semibold">Do you also need new tires installed?</legend>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {[
                        { value: true, label: "Yes" },
                        { value: false, label: "No" },
                      ].map((option) => (
                        <ChoiceCard
                          key={String(option.value)}
                          name="winter-new-tires"
                          value={String(option.value)}
                          label={option.label}
                          checked={state.winterNeedsNewTires === option.value}
                          onChange={() => dispatch({ type: "set-winter-new-tires", value: option.value })}
                          testId={`winter-new-tires-${option.value ? "yes" : "no"}`}
                        />
                      ))}
                    </div>
                  </fieldset>
                )}

                {state.need === "repair" && (
                  <div className="mt-6">
                    <FieldLabel htmlFor="wizard-issue">Briefly describe the issue</FieldLabel>
                    <textarea
                      id="wizard-issue"
                      rows={3}
                      maxLength={300}
                      value={state.issueDescription}
                      onChange={(event) => dispatch({ type: "set-issue", value: event.target.value })}
                      className="t4t-focus w-full resize-y rounded-xl border bg-background p-3 text-base"
                      placeholder="For example: slow leak in the front tire"
                      required
                      data-testid="issue-description"
                    />
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      {state.issueDescription.length}/300
                    </p>
                  </div>
                )}

                {outcomeCopy[state.outcome] && (
                  <div className="mt-6 rounded-xl border border-[hsl(var(--t4t-cta))]/30 bg-[hsl(var(--t4t-wash-1))] p-4" role="status" data-testid="next-step-notice" data-outcome={state.outcome}>
                    <p className="flex items-start gap-2 font-semibold">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />
                      <span>{outcomeCopy[state.outcome]}</span>
                    </p>
                    <p className="mt-2 pl-7 text-sm leading-relaxed text-muted-foreground">
                      Your selections stay in this browser. Nothing has been submitted, and no request has been created.
                    </p>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "edit-need" })}
                      className="t4t-focus mt-3 min-h-10 rounded-lg px-2 text-sm font-semibold underline underline-offset-4"
                      data-testid="edit-need"
                    >
                      Edit this step
                    </button>
                  </div>
                )}

                {!outcomeCopy[state.outcome] && (
                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      No contact details are requested at this stage.
                    </p>
                    <button
                      type="submit"
                      className="t4t-btn-primary w-full sm:w-auto"
                      disabled={!canContinueNeed(state)}
                      data-testid="continue-need"
                    >
                      Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </form>
            )}

            {!loading && !error && initialized && state.step === 3 && (
              <VehicleTireStep vehicle={state.vehicle} guidanceNeeded={state.outcome === "guidance_needed"} dispatch={dispatch} />
            )}

            <div className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground" data-testid="privacy-note">
              We don’t ask for contact information here, and no tire request is created. Your selections are saved in this browser only.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
