import { Link, Navigate, useLocation } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/site/CitySelector";
import { PageShell, useCarry } from "@/components/site/PageShell";
import { Faq, HowItWorks } from "@/components/site/Sections";
import { Seo } from "@/components/site/Seo";
import { useSite } from "@/context/SiteContext";

export default function HomePage() {
  const { cities, loading, error, reload, stateOf, findCity, openSelector } = useSite();
  const { search } = useLocation();
  const carry = useCarry();

  // /?city=ottawa goes straight to that city's page. The original URL was already captured.
  const requested = findCity(new URLSearchParams(search).get("city"));
  if (requested) return <Navigate to={{ pathname: `/${requested.slug}`, search }} replace />;

  return (
    <PageShell>
      <Seo
        title="Tires installed at a clear all-in price"
        description="Tell us your vehicle and tire needs and get a clear all-in installed price from a local partner shop."
        indexable={false}
        path="/"
      />
      <section className="t4t-container pt-6 sm:pt-10" data-testid="home-hero">
        <div className="t4t-noise relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[hsl(var(--t4t-wash-1))] to-[hsl(var(--t4t-wash-2))]">
          <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" data-testid="hero-title">
              Find tire installation in your city
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground sm:text-lg">
              Tell us your vehicle and tire needs and get a clear all-in installed price from a local partner shop.
              Start by choosing your city.
            </p>
            <div className="mt-8">
              <button type="button" onClick={openSelector} className="t4t-btn-primary t4t-focus w-full sm:w-auto" data-testid="home-choose-city-button">
                <MapPin className="h-5 w-5" aria-hidden="true" />
                Choose your city
              </button>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground" data-testid="hero-trust-line">
              No cost to request a quote. All-in pricing includes tires, mounting, balancing, disposal, and taxes.
            </p>
          </div>
        </div>
      </section>

      <section className="t4t-container pt-12 sm:pt-16" data-testid="home-locations" aria-labelledby="locations-title">
        <h2 id="locations-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Locations</h2>
        {loading && <p className="mt-6 text-sm text-muted-foreground" data-testid="locations-loading">Loading locations&hellip;</p>}
        {error && (
          <div className="mt-6 rounded-xl border bg-card p-5 text-sm" data-testid="locations-error">
            We couldn&rsquo;t load the list of locations.{" "}
            <button type="button" className="font-semibold text-[hsl(var(--t4t-cta))] underline" onClick={reload} data-testid="locations-retry-button">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && (
          <>
            {cities.every((c) => stateOf(c) !== "live") && (
              <p className="mt-4 max-w-2xl text-base text-muted-foreground" data-testid="home-none-available">
                No locations are open for tire-match requests yet. These are the cities we are preparing first.
              </p>
            )}
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={carry(`/${c.slug}`)}
                    className="t4t-focus group flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
                    data-testid={`home-city-card-${c.slug}`}
                  >
                    <span>
                      <span className="block font-heading text-lg font-semibold">{c.name}</span>
                      <span className="mt-1 block"><StatusBadge state={stateOf(c)} testId={`home-city-status-${c.slug}`} /></span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <HowItWorks />
      <Faq />
    </PageShell>
  );
}
