import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { normalizeTireSize, TIRE_CONDITIONS, TIRE_TYPES } from "@/lib/tireMatchWizard";

const fieldClass = "t4t-focus min-h-12 w-full rounded-xl border bg-background px-3 text-base";
const labelClass = "mb-2 block text-sm font-semibold";

export default function VehicleTireStep({ vehicle, guidanceNeeded, dispatch }) {
  const [showError, setShowError] = useState(false);
  const sizeInput = useRef(null);
  const heading = useRef(null);
  const { saved, tireSize } = vehicle;
  const invalid = showError && !normalizeTireSize(tireSize);
  const update = (field) => (event) => dispatch({ type: "set-vehicle-field", field, value: event.target.value });

  useEffect(() => {
    heading.current?.focus();
  }, [saved]);

  function submit(event) {
    event.preventDefault();
    if (!normalizeTireSize(tireSize)) {
      setShowError(true);
      sizeInput.current?.focus();
      return;
    }
    setShowError(false);
    dispatch({ type: "save-vehicle" });
  }

  return (
    <div data-testid="vehicle-step">
      <button type="button" onClick={() => dispatch({ type: "back" })} data-testid="wizard-back"
        className="t4t-focus -ml-2 mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
      </button>
      <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--t4t-cta))]">Vehicle and tire size</p>
      <h1 ref={heading} tabIndex={-1} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" data-testid="step-heading">
        {saved ? "Tire size saved" : "What tire size do you need?"}
      </h1>
      {saved ? (
        <div className="mt-5 rounded-xl border border-[hsl(var(--t4t-cta))]/30 bg-[hsl(var(--t4t-wash-1))] p-4" data-testid="vehicle-saved">
          <p className="flex items-center gap-2 font-semibold">
            <Check className="h-5 w-5 shrink-0 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />
            <span>{tireSize}</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Saved in this browser. No tire request has been submitted.</p>
          <button type="button" onClick={() => dispatch({ type: "edit-vehicle" })}
            className="t4t-focus mt-2 min-h-11 rounded-lg px-2 text-sm font-semibold underline underline-offset-4">
            Edit tire details
          </button>
        </div>
      ) : (
        <form className="mt-5 space-y-5" onSubmit={submit} noValidate>
          {guidanceNeeded && (
            <p className="text-sm leading-relaxed text-muted-foreground">Not sure which type you need? Leave tire type set to Unknown.</p>
          )}
          <div>
            <label htmlFor="wizard-tire-size" className={labelClass}>Tire size</label>
            <input ref={sizeInput} id="wizard-tire-size" type="text" autoComplete="off" maxLength={40}
              placeholder="205/55R16" className={fieldClass} value={tireSize} onChange={update("tireSize")}
              aria-describedby={`wizard-size-help${invalid ? " wizard-size-error" : ""}`} aria-invalid={invalid} required />
            <p id="wizard-size-help" className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Look for a size like 205/55R16 on the sidewall. To check the recommended size, see the label inside the driver’s door or your owner’s manual.
            </p>
            {invalid && (
              <p id="wizard-size-error" role="alert" className="mt-2 text-sm font-semibold text-destructive">
                Enter the full tire size, for example 205/55R16.
              </p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="wizard-tire-type" className={labelClass}>Tire type</label>
              <select id="wizard-tire-type" className={fieldClass} value={vehicle.tireType} onChange={update("tireType")}>
                {TIRE_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="wizard-tire-condition" className={labelClass}>
                Current tire condition <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <select id="wizard-tire-condition" className={fieldClass} value={vehicle.condition} onChange={update("condition")}>
                <option value="">Choose a condition</option>
                {TIRE_CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
              </select>
            </div>
          </div>
          <details className="rounded-xl border bg-background px-4">
            <summary className="t4t-focus flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-lg text-sm font-semibold">
              Add vehicle details <span className="font-normal text-muted-foreground">Optional</span>
            </summary>
            <div className="grid gap-4 pb-4 sm:grid-cols-2">
              {[
                ["make", "Make", "Honda"], ["model", "Model", "Civic"], ["year", "Year", "2018"], ["trim", "Trim", "EX"],
              ].map(([field, label, placeholder]) => (
                <div key={field}>
                  <label htmlFor={`wizard-vehicle-${field}`} className={labelClass}>{label}</label>
                  <input id={`wizard-vehicle-${field}`} type="text" inputMode={field === "year" ? "numeric" : undefined}
                    maxLength={field === "year" ? 4 : 60} placeholder={placeholder} className={fieldClass}
                    value={vehicle[field]} onChange={update(field)} />
                </div>
              ))}
            </div>
          </details>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">Your progress is saved on this device only. Nothing is submitted.</p>
            <button type="submit" className="t4t-btn-primary w-full sm:w-auto">Save tire details</button>
          </div>
        </form>
      )}
    </div>
  );
}
