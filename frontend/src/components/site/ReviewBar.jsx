import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Eye, ListTree, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LAUNCH_STATES, useSite } from "@/context/SiteContext";
import { ATTRIBUTION_KEYS, clearAttribution, getAttributionRecord } from "@/lib/attribution";

/**
 * Staging-only internal tools. Rendered only when the API reports preview_enabled
 * (never in production). Lets a reviewer preview each city state without changing the
 * database, and inspect the attribution captured in this browser.
 */
export const ReviewBar = () => {
  const { previewEnabled, previewState, setPreviewState, findCity, selectedCitySlug } = useSite();
  const location = useLocation();
  const [record, setRecord] = useState(getAttributionRecord);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setRecord(getAttributionRecord());
  }, [location, open]);

  if (!previewEnabled) return null;

  const city = findCity(location.pathname.split("/").filter(Boolean)[0]);
  const original = record?.original || {};
  const captured = ATTRIBUTION_KEYS.filter((k) => original[k]).length;

  return (
    <div
      className="border-b border-black/40 bg-[hsl(var(--t4t-internal))] text-white"
      data-testid="staging-review-bar"
    >
      <div className="t4t-container flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
        <span className="font-mono-internal text-[11px] uppercase tracking-widest text-white/70">
          Staging &middot; internal review tools
        </span>

        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
          <Select value={previewState || "actual"} onValueChange={(v) => setPreviewState(v === "actual" ? null : v)}>
            <SelectTrigger
              className="h-8 w-[168px] border-white/25 bg-white/10 text-xs text-white"
              data-testid="staging-state-switch"
              aria-label="Preview city state"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actual" data-testid="staging-state-option-actual">Actual status</SelectItem>
              {LAUNCH_STATES.map((s) => (
                <SelectItem key={s} value={s} data-testid={`staging-state-option-${s}`}>
                  Preview: {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {city && (
          <span className="font-mono-internal rounded-full bg-white/10 px-2 py-1 text-xs" data-testid="staging-actual-status">
            {city.name} actual: {city.launch_status}
            {previewState ? ` \u2192 previewing ${previewState}` : ""}
          </span>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="font-mono-internal inline-flex h-8 items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 text-xs text-white hover:bg-white/20"
              data-testid="staging-attribution-button"
            >
              <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
              Attribution ({captured}/{ATTRIBUTION_KEYS.length})
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(92vw,26rem)] p-0" data-testid="staging-attribution-panel">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-semibold">Original attribution (this browser)</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Written once on first landing. Changing city or navigating never overwrites it.
              </p>
            </div>
            <dl className="font-mono-internal max-h-[50vh] overflow-y-auto px-4 py-3 text-xs">
              {ATTRIBUTION_KEYS.map((key) => (
                <div key={key} className="flex gap-3 border-b border-dashed py-1.5 last:border-0">
                  <dt className="w-28 shrink-0 text-muted-foreground">{key}</dt>
                  <dd className="min-w-0 break-all" data-testid={`staging-attribution-item-${key}`}>
                    {original[key] || "\u2014"}
                  </dd>
                </div>
              ))}
              <div className="flex gap-3 border-b border-dashed py-1.5">
                <dt className="w-28 shrink-0 text-muted-foreground">landing page city</dt>
                <dd data-testid="staging-attribution-landing-city">{record?.original_meta?.landing_path_city || "\u2014"}</dd>
              </div>
              <div className="flex gap-3 border-b border-dashed py-1.5">
                <dt className="w-28 shrink-0 text-muted-foreground">selected city</dt>
                <dd data-testid="staging-selected-city">{selectedCitySlug || "\u2014"}</dd>
              </div>
              <div className="flex gap-3 py-1.5">
                <dt className="w-28 shrink-0 text-muted-foreground">later touch</dt>
                <dd className="min-w-0 break-all" data-testid="staging-attribution-last-touch">
                  {record?.last_touch
                    ? ATTRIBUTION_KEYS.filter((k) => record.last_touch[k] && k !== "landing_url" && k !== "referrer_url")
                        .map((k) => `${k}=${record.last_touch[k]}`)
                        .join(" ") || "\u2014"
                    : "\u2014"}
                </dd>
              </div>
            </dl>
            <div className="border-t px-4 py-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                data-testid="staging-attribution-clear"
                onClick={() => {
                  clearAttribution();
                  setRecord(null);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Clear stored attribution (to test a fresh visit, then reload)
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
