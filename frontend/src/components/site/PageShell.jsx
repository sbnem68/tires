import { Link, useLocation } from "react-router-dom";
import { ChevronDown, MapPin } from "lucide-react";
import { CitySelector } from "@/components/site/CitySelector";
import { InterestDialog } from "@/components/site/InterestDialog";
import { ReviewBar } from "@/components/site/ReviewBar";
import { useSite } from "@/context/SiteContext";

/** Internal links keep the current query string so attribution parameters pass through. */
export const useCarry = () => {
  const { search } = useLocation();
  return (pathname) => ({ pathname, search });
};

const SiteHeader = ({ city }) => {
  const { openSelector, stateOf } = useSite();
  const carry = useCarry();
  const isLive = city && stateOf(city) === "live";

  return (
    <header className="sticky top-0 z-40 border-b bg-background" data-testid="site-header">
      <div className="t4t-container flex h-16 items-center justify-between gap-3">
        <Link to={carry("/")} className="t4t-focus rounded-md font-heading text-xl font-bold tracking-tight" data-testid="site-wordmark">
          Tires<span className="text-[hsl(var(--t4t-cta))]">4</span>Today
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSelector}
            className="t4t-focus inline-flex min-h-[44px] items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium shadow-sm transition-colors duration-150 hover:bg-muted"
            data-testid="city-selector-trigger"
          >
            <MapPin className="h-4 w-4 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />
            <span data-testid="header-current-city">{city ? city.name : "Choose city"}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
          {isLive && (
            <Link
              to={carry("/tire-match")}
              className="t4t-btn-primary t4t-focus hidden min-h-[44px] px-4 text-sm md:inline-flex"
              data-testid="primary-cta-header"
            >
              Find My Tire Match
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const SiteFooter = () => {
  const { cities, stateOf } = useSite();
  const carry = useCarry();
  const groups = [
    { title: "Available locations", items: cities.filter((c) => stateOf(c) === "live"), empty: "None open yet" },
    { title: "Coming soon", items: cities.filter((c) => stateOf(c) !== "live"), empty: null },
  ];

  return (
    <footer className="mt-16 border-t bg-card" data-testid="site-footer">
      <div className="t4t-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="font-heading text-lg font-bold tracking-tight">
            Tires<span className="text-[hsl(var(--t4t-cta))]">4</span>Today
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground" data-testid="footer-all-in-statement">
            All-in pricing includes tires, mounting, balancing, disposal, and taxes.
          </p>
        </div>
        {groups.map((group) =>
          group.items.length === 0 && !group.empty ? null : (
            <nav key={group.title} aria-label={group.title}>
              <div className="text-sm font-semibold">{group.title}</div>
              <ul className="mt-3 space-y-2">
                {group.items.length === 0 && <li className="text-sm text-muted-foreground">{group.empty}</li>}
                {group.items.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={carry(`/${c.slug}`)}
                      className="t4t-focus rounded text-sm text-muted-foreground hover:text-foreground"
                      data-testid={`footer-city-link-${c.slug}`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )
        )}
      </div>
      <div className="border-t">
        <div className="t4t-container py-4 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Tires4Today. Installation is carried out by independent local partner shops.
        </div>
      </div>
    </footer>
  );
};

export const PageShell = ({ city = null, children }) => (
  <div className="min-h-screen bg-background text-left text-foreground">
    <ReviewBar />
    <SiteHeader city={city} />
    <main>{children}</main>
    <SiteFooter />
    <CitySelector />
    <InterestDialog />
  </div>
);
