import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useSite } from "@/context/SiteContext";
import { markUrlCityApplied, requestedCityFrom } from "@/lib/tireMatchWizard";

const BADGES = {
  live: { label: "Available", className: "border-sky-300 bg-[hsl(var(--t4t-wash-1))] text-foreground" },
  coming_soon: {
    label: "Coming soon",
    className: "border-[hsl(var(--t4t-warning-border))] bg-[hsl(var(--t4t-warning-bg))] text-[hsl(var(--t4t-warning-ink))]",
  },
  paused: { label: "Paused", className: "border-border bg-muted text-muted-foreground" },
};

export const StatusBadge = ({ state, testId }) => (
  <span
    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGES[state].className}`}
    data-testid={testId}
  >
    {BADGES[state].label}
  </span>
);

const CityOption = ({ city, state, onSelect }) => (
  <CommandItem
    // Subarea names are searchable but always resolve to their parent city.
    value={[city.name, ...city.subareas.map((s) => s.name)].join(" ")}
    onSelect={() => onSelect(city)}
    className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3"
    data-testid={`city-selector-city-option-${city.slug}`}
  >
    <span className="min-w-0">
      <span className="font-medium">{city.name}</span>
      <span className="ml-2 text-xs text-muted-foreground">{city.province_code}</span>
      {city.subareas.length > 0 && (
        <span className="block text-xs text-muted-foreground">
          Includes {city.subareas.map((s) => s.name).join(", ")}
        </span>
      )}
    </span>
    <StatusBadge state={state} />
  </CommandItem>
);

/** Searchable city selector. Changing city keeps the query string and never touches attribution. */
export const CitySelector = () => {
  const { cities, stateOf, selectorOpen, setSelectorOpen, selectCity } = useSite();
  const navigate = useNavigate();
  const { search } = useLocation();

  const groups = { live: [], coming_soon: [], paused: [] };
  cities.forEach((city) => groups[stateOf(city)].push(city));

  const choose = (city) => {
    // An explicit choice here outranks a city parameter still carried in the query string.
    markUrlCityApplied(requestedCityFrom(search));
    selectCity(city.slug);
    setSelectorOpen(false);
    navigate({ pathname: `/${city.slug}`, search });
  };

  return (
    <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" data-testid="city-selector-dialog">
        <DialogHeader className="px-4 pb-2 pt-5 text-left sm:px-5">
          <DialogTitle className="font-heading text-xl">Choose your city</DialogTitle>
          <DialogDescription>Search for your city to see whether tire-match requests are open there.</DialogDescription>
        </DialogHeader>
        <Command className="border-t">
          <CommandInput placeholder="Search city\u2026" data-testid="city-selector-search-input" />
          <CommandList className="max-h-[55vh]">
            <CommandEmpty data-testid="city-selector-empty">
              <span className="block px-4 text-sm">
                We don&rsquo;t have a page for that city yet. It isn&rsquo;t one of our current or upcoming locations.
              </span>
            </CommandEmpty>

            <CommandGroup heading="Available locations" data-testid="city-selector-available-group">
              {groups.live.map((city) => (
                <CityOption key={city.slug} city={city} state="live" onSelect={choose} />
              ))}
            </CommandGroup>
            {groups.live.length === 0 && (
              <p className="px-4 pb-3 text-sm text-muted-foreground" data-testid="city-selector-none-available">
                No locations are open for tire-match requests yet.
              </p>
            )}

            {groups.coming_soon.length > 0 && (
              <CommandGroup heading={"Coming soon \u2014 register interest"} data-testid="city-selector-coming-soon-group">
                {groups.coming_soon.map((city) => (
                  <CityOption key={city.slug} city={city} state="coming_soon" onSelect={choose} />
                ))}
              </CommandGroup>
            )}

            {groups.paused.length > 0 && (
              <CommandGroup heading="Temporarily paused" data-testid="city-selector-paused-group">
                {groups.paused.map((city) => (
                  <CityOption key={city.slug} city={city} state="paused" onSelect={choose} />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
