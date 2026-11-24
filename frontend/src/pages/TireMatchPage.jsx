import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Info, MapPin, RotateCcw } from "lucide-react";
import { PageShell, useCarry } from "@/components/site/PageShell";
import { Seo } from "@/components/site/Seo";
import { useSite } from "@/context/SiteContext";
import { ATTRIBUTION_KEYS, getAttribution } from "@/lib/attribution";
import {
  canContinueFromNeed,
  createInitialWizardState,
  getNextStep,
  NEED_OPTIONS,
  readWizardProgress,
  saveWizardProgress,
  TOTAL_WIZARD_STEPS,
  TRAVEL_RADIUS_OPTIONS,
} from "@/lib/tireMatchWizard";

const progressText = (step) => `Step ${step} of ${TOTAL_WIZARD_STEPS}`;

function Progress({ step }) {
  return (
    <div className="mb-8" data-testid="wizard-progress-wrap">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span data-testid="wizard-progress-label">{progressText(step)}</span>
        <span className="text-muted-foreground">Your progress stays on this device</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label={progressText(step)}
        aria-valuemin="1"
        aria-valuemax={TOTAL_WIZARD_STEPS}
        aria-valuenow={step}
        data-testid="wizard-progress"
      >
        <div
          className="h-full rounded-full bg-[hsl(var(--t4t-cta))] transition-[width] duration-300"
          style={{ width: `${(step / TOTAL_WIZARD_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function WizardNotice({ children, warning = false }) {
  return (
    <div
      className={`mt-5 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${
        warning
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-border bg-secondary text-muted-foreground"
      }`}
      role={warning ? "alert" : undefined}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function StepOne({ cities, state, onChange, onContinue, validationMessage }) {
  return (
    <section aria-labelledby="wizard-step-one-heading" data-testid="wizard-step-one">
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-1 rounded-xl bg-[hsl(var(--t4t-wash-1))] p-2 text-[hsl(var(--t4t-cta))]">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--t4t-cta))]">City and location</p>
          <h2 id="wizard-step-one-heading" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Which city are you in?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Choose a listed city. Postal code and travel distance are optional.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold">City</span>
          <select
            className="t4t-focus min-h-12 w-full rounded-xl border bg-background px-4 text-base"
            value={state.city}
            onChange={(event) => onChange("city", event.target.value)}
            aria-label="City"
            data-testid="wizard-city"
          >
            <option value="">Choose a city</option>
            {cities.map((city) => (
              <option key={city.slug} value={city.slug}>{city.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Postal code <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <input
            className="t4t-focus min-h-12 w-full rounded-xl border bg-background px-4 text-base"
            type="text"
            name="postalCode"
            autoComplete="postal-code"
            maxLength={16}
            value={state.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
            aria-label="Postal code, optional"
            data-testid="wizard-postal-code"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Travel radius <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <select
            className="t4t-focus min-h-12 w-full rounded-xl border bg-background px-4 text-base"
            value={state.travelRadius}
            onChange={(event) => onChange("travelRadius", event.target.value)}
            aria-label="Travel radius, optional"
            data-testid="wizard-travel-radius"
          >
            <option value="">Choose a travel radius</option>
            {TRAVEL_RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {validationMessage && <p className="mt-4 text-sm font-medium text-destructive" role="alert">{validationMessage}</p>}

      <WizardNotice>
        This preview does not ask for contact details. Your location and selections are saved only in this browser.
      </WizardNotice>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <a href="/" className="t4t-btn-secondary t4t-focus w-full sm:w-auto" data-testid="wizard-back-link">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </a>
        <button
          type="button"
          onClick={onContinue}
          disabled={!state.city}
          className="t4t-btn-primary t4t-focus w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          data-testid="wizard-step-one-continue"
        >
          Continue
        </button>
      </div>
    </section>
  );
}

function StepTwo({ state, onChange, onContinue, onBack, validationMessage }) {
  const nextStep = getNextStep(state);
  return (
    <section aria-labelledby="wizard-step-two-heading" data-testid="wizard-step-two">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--t4t-cta))]">Need selection</p>
        <h2 id="wizard-step-two-heading" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          What do you need today?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Choose one option. No request or booking is created.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Choose what you need today</legend>
        <div className="grid gap-3">
          {NEED_OPTIONS.map((option) => {
            const selected = state.need === option.value;
            return (
              <label
                key={option.value}
                className={`t4t-focus flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  selected
                    ? "border-[hsl(var(--t4t-cta))] bg-[hsl(var(--t4t-wash-1))]"
                    : "bg-card hover:bg-muted"
                }`}
                data-testid={`wizard-need-option-${option.value}`}
              >
                <input
                  type="radio"
                  name="need"
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange("need", option.value)}
                  className="h-4 w-4 accent-[hsl(var(--t4t-cta))]"
                />
                <span className="font-medium">{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.need === "winter_changeover" && (
        <fieldset className="mt-5 rounded-xl border bg-card p-4" data-testid="wizard-winter-followup">
          <legend className="px-1 text-sm font-semibold">Do you also need new tires installed?</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ].map((option) => (
              <label key={option.value} className="t4t-focus inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4">
                <input
                  type="radio"
                  name="newTires"
                  value={option.value}
                  checked={state.newTires === option.value}
                  onChange={() => onChange("newTires", option.value)}
                  className="h-4 w-4 accent-[hsl(var(--t4t-cta))]"
                  data-testid={`wizard-new-tires-${option.value}`}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {state.need === "repair_inspection" && (
        <label className="mt-5 block" data-testid="wizard-repair-description-wrap">
          <span className="mb-2 block text-sm font-semibold">
            Briefly describe the issue <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <textarea
            className="t4t-focus min-h-24 w-full resize-y rounded-xl border bg-background px-4 py-3 text-base"
            value={state.issueDescription}
            maxLength={500}
            onChange={(event) => onChange("issueDescription", event.target.value)}
            aria-label="Briefly describe the issue, optional"
            data-testid="wizard-repair-description"
          />
        </label>
      )}

      {validationMessage && <p className="mt-4 text-sm font-medium text-destructive" role="alert">{validationMessage}</p>}

      {state.showNextStep && nextStep && (
        <div
          className="mt-5 rounded-xl border border-[hsl(var(--t4t-cta))] bg-[hsl(var(--t4t-wash-1))] p-4"
          data-testid="wizard-next-step"
          data-next-step={nextStep.destination}
        >
          <p className="text-sm font-semibold text-[hsl(var(--t4t-cta))]">Next step</p>
          <h3 className="mt-1 text-lg font-bold">{nextStep.label}</h3>
          {nextStep.guidanceNeeded && (
            <p className="mt-2 text-sm" data-testid="wizard-guidance-needed">
              We’ll help you choose as you continue.
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The next intake step is not part of this checkpoint. Your progress stays in this browser; nothing is sent.
          </p>
          <button
            type="button"
            onClick={() => onChange("showNextStep", false)}
            className="t4t-btn-secondary t4t-focus mt-4 min-h-11 px-4 text-sm"
            data-testid="wizard-change-need"
          >
            Change this selection
          </button>
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="t4t-btn-secondary t4t-focus w-full sm:w-auto"
          data-testid="wizard-back-to-step-one"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        {!state.showNextStep && (
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinueFromNeed(state)}
            className="t4t-btn-primary t4t-focus w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            data-testid="wizard-step-two-continue"
          >
            Continue
          </button>
        )}
      </div>
    </section>
  );
}

export default function TireMatchPage() {
  const { search } = useLocation();
  const carry = useCarry();
  const { cities, loading, error, reload, findCity, selectedCitySlug, selectCity, previewEnabled } = useSite();
  const [wizard, setWizard] = useState(() => createInitialWizardState(search, selectedCitySlug, readWizardProgress()));
  const [storageWarning, setStorageWarning] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const attribution = getAttribution();
  const city = useMemo(
    () => (findCity ? findCity(wizard.city) : cities.find((item) => item.slug === wizard.city)) || null,
    [cities, findCity, wizard.city],
  );

  useEffect(() => {
    setStorageWarning(!saveWizardProgress(wizard));
  }, [wizard]);

  useEffect(() => {
    if (loading || error || !cities.length) return;
    const available = (slug) => cities.some((item) => item.slug === slug);
    const requestedCity = new URLSearchParams(search).get("city")?.trim().toLowerCase() || "";
    if (wizard.city && !available(wizard.city)) {
      const fallback = [requestedCity, selectedCitySlug].find(available) || "";
      setWizard((current) => ({
        ...current,
        city: fallback,
        cityManuallySelected: false,
        step: 1,
        showNextStep: false,
      }));
    } else if (wizard.city && wizard.city !== selectedCitySlug && available(wizard.city)) {
      selectCity(wizard.city);
    }
  }, [cities, error, loading, search, selectCity, selectedCitySlug, wizard.city]);

  const updateField = (field, value) => {
    setValidationMessage("");
    if (field === "city" && value) selectCity(value);
    setWizard((current) => {
      const next = { ...current, [field]: value, showNextStep: field === "showNextStep" ? value : false };
      if (field === "need") {
        next.newTires = "";
        next.issueDescription = "";
      }
      if (field === "city") {
        next.cityManuallySelected = Boolean(value);
      }
      return next;
    });
  };

  const handleContinueFromCity = () => {
    if (!wizard.city || !city) {
      setValidationMessage("Choose one of the listed cities to continue.");
      return;
    }
    setValidationMessage("");
    setWizard((current) => ({ ...current, step: 2, showNextStep: false }));
  };

  const handleContinueFromNeed = () => {
    if (!canContinueFromNeed(wizard)) {
      setValidationMessage(
        wizard.need === "winter_changeover"
          ? "Choose yes or no about new tires to continue."
          : "Choose one option to continue.",
      );
      return;
    }
    setValidationMessage("");
    setWizard((current) => ({ ...current, showNextStep: true }));
  };

  const handleBackToCity = () => {
    setValidationMessage("");
    setWizard((current) => ({ ...current, step: 1, showNextStep: false }));
  };

  return (
    <PageShell city={city}>
      <Seo title="Tire Match" indexable={false} path="/tire-match" />
      <section className="t4t-container py-8 sm:py-14" data-testid="tire-match-page">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-sm sm:p-9">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(var(--t4t-cta))]">
              Tire Match
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" data-testid="tire-match-title">
              Let’s find the right next step.
            </h1>
            {city && (
              <p className="mt-3 text-sm text-muted-foreground">
                Selected city: <span className="font-semibold text-foreground" data-testid="tire-match-city">{city.name}</span>
              </p>
            )}
          </div>

          <Progress step={wizard.step} />

          {loading && (
            <div className="rounded-xl border bg-secondary p-5 text-sm text-muted-foreground" role="status">
              Loading listed cities…
            </div>
          )}
          {error && !loading && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5" role="alert">
              <p className="font-semibold">City information could not be loaded.</p>
              <p className="mt-1 text-sm text-muted-foreground">Please try again before continuing.</p>
              <button type="button" onClick={reload} className="t4t-btn-secondary t4t-focus mt-4 min-h-11 px-4 text-sm">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            </div>
          )}
          {!loading && !error && cities.length > 0 && wizard.step === 1 && (
            <StepOne
              cities={cities}
              state={wizard}
              onChange={updateField}
              onContinue={handleContinueFromCity}
              validationMessage={validationMessage}
            />
          )}
          {!loading && !error && cities.length > 0 && wizard.step === 2 && (
            <StepTwo
              state={wizard}
              onChange={updateField}
              onContinue={handleContinueFromNeed}
              onBack={handleBackToCity}
              validationMessage={validationMessage}
            />
          )}

          {storageWarning && (
            <WizardNotice warning>
              This browser did not allow progress to be saved. You can continue, but it may not survive a refresh.
            </WizardNotice>
          )}

          <WizardNotice>
            No contact information is collected, no lead is created, and nothing is sent to a server.
          </WizardNotice>

          {previewEnabled && (
            <details className="mt-6 rounded-xl border bg-secondary p-4" data-testid="tire-match-carried-attribution">
              <summary className="cursor-pointer text-sm font-semibold">Staging only: original landing attribution</summary>
              <dl className="mt-3 grid gap-x-4 gap-y-2 font-mono-internal text-xs sm:grid-cols-2">
                {ATTRIBUTION_KEYS.map((key) => (
                  <div key={key} className="min-w-0">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="break-all" data-testid={`carried-attribution-${key}`}>{attribution[key] || "—"}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          <div className="mt-7 border-t pt-5 text-sm">
            <Link
              to={carry(city ? `/${city.slug}` : "/")}
              className="t4t-focus inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-medium text-muted-foreground hover:text-foreground"
              data-testid="tire-match-back-link"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to {city?.name || "home"}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
