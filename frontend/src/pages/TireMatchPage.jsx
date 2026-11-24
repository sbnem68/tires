import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { PageShell, useCarry } from "@/components/site/PageShell";
import { Seo } from "@/components/site/Seo";
import { useSite } from "@/context/SiteContext";
import { ATTRIBUTION_KEYS, getAttribution } from "@/lib/attribution";

/**
 * Destination of "Find My Tire Match". The wizard itself is Checkpoint 2 and is intentionally
 * not built. This page only shows that the selected city and attribution arrive intact.
 * Nothing is collected or submitted here.
 */
export default function TireMatchPage() {
  const { findCity, selectedCitySlug, previewEnabled, stateOf } = useSite();
  const { search } = useLocation();
  const carry = useCarry();
  // Requested city: the driver's own selection first, then the ?city= parameter (embeds).
  const city = findCity(selectedCitySlug) || findCity(new URLSearchParams(search).get("city"));
  const attribution = getAttribution();

  return (
    <PageShell city={city}>
      <Seo title="Tire Match" indexable={false} path="/tire-match" />
      <section className="t4t-container py-10 sm:py-16" data-testid="tire-match-page">
        <div className="max-w-2xl rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="tire-match-title">Tire Match request</h1>
          {city && (
            <p className="mt-3 text-base text-muted-foreground">
              Location: <span className="font-semibold text-foreground" data-testid="tire-match-city">{city.name}</span>
              {stateOf(city) !== "live" && <span data-testid="tire-match-city-not-open"> (not open for requests yet)</span>}
            </p>
          )}
          <div
            className="mt-6 flex gap-3 rounded-xl border border-[hsl(var(--t4t-warning-border))] bg-[hsl(var(--t4t-warning-bg))] p-4 text-sm leading-relaxed text-[hsl(var(--t4t-warning-ink))]"
            data-testid="tire-match-not-built-notice"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>The request form isn&rsquo;t available yet. Nothing is collected or sent from this page.</span>
          </div>

          {previewEnabled && (
            <div className="mt-6 rounded-xl border bg-secondary p-4" data-testid="tire-match-carried-attribution">
              <div className="font-mono-internal text-[11px] uppercase tracking-widest text-muted-foreground">
                Staging only &middot; attribution carried into the form
              </div>
              <dl className="font-mono-internal mt-3 text-xs">
                {ATTRIBUTION_KEYS.map((key) => (
                  <div key={key} className="flex gap-3 py-1">
                    <dt className="w-28 shrink-0 text-muted-foreground">{key}</dt>
                    <dd className="min-w-0 break-all" data-testid={`carried-attribution-${key}`}>{attribution[key] || "\u2014"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <Link to={carry(city ? `/${city.slug}` : "/")} className="t4t-btn-secondary t4t-focus mt-8 w-full sm:w-auto" data-testid="tire-match-back-link">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
