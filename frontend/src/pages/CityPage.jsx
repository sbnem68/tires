import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ComingSoonHero, LiveHero, PausedHero } from "@/components/site/CityHero";
import { PageShell } from "@/components/site/PageShell";
import { Faq, HowItWorks } from "@/components/site/Sections";
import { Seo } from "@/components/site/Seo";
import { useSite } from "@/context/SiteContext";
import NotFoundPage from "@/pages/NotFoundPage";

const HEROES = { live: LiveHero, coming_soon: ComingSoonHero, paused: PausedHero };

export default function CityPage() {
  const { citySlug } = useParams();
  const { loading, error, reload, findCity, stateOf, previewState, selectCity } = useSite();
  const city = findCity(citySlug);

  // Visiting a city page selects that city. Attribution is stored separately and is not touched.
  useEffect(() => {
    if (city) selectCity(city.slug);
  }, [city, selectCity]);

  if (loading || error) {
    return (
      <PageShell>
        <Seo title="Tires4Today" indexable={false} />
        <div className="t4t-container py-16" data-testid={error ? "city-error" : "city-loading"}>
          {error ? (
            <div className="rounded-xl border bg-card p-6 text-sm">
              We couldn&rsquo;t load this page.{" "}
              <button type="button" className="font-semibold text-[hsl(var(--t4t-cta))] underline" onClick={reload} data-testid="city-retry-button">
                Try again
              </button>
            </div>
          ) : (
            <div className="h-72 animate-pulse rounded-2xl border bg-muted" />
          )}
        </div>
      </PageShell>
    );
  }

  // Unlisted cities (the other 25) and unknown slugs have no public page.
  if (!city) return <NotFoundPage />;

  const state = stateOf(city);
  const Hero = HEROES[state];
  const isLive = state === "live";
  // Index only a genuinely live, approved city. A staging preview is never indexable.
  const indexable = city.indexable && isLive && !previewState;

  return (
    <PageShell city={city}>
      <Seo
        title={isLive ? `Winter Tires Installed in ${city.name}` : `Tires4Today in ${city.name}`}
        description={
          isLive
            ? `Winter tires installed in ${city.name}. Real all-in prices including tires, mounting, balancing, disposal, and taxes.`
            : `Tires4Today is not taking tire-match requests in ${city.name} yet.`
        }
        indexable={indexable}
        path={`/${city.slug}`}
      />
      <div data-testid="city-page" data-city-slug={city.slug} data-city-state={state}>
        <Hero city={city} />
        <HowItWorks />
        <Faq />
      </div>
    </PageShell>
  );
}
