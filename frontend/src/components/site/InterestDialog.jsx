import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSite } from "@/context/SiteContext";

/**
 * Explains what interest registration is for. Checkpoint 1 collects no customer data, so
 * there is deliberately no form here yet: nothing is stored, no lead is created, no shop is notified.
 */
export const InterestDialog = () => {
  const { interestCity, closeInterest, openSelector } = useSite();
  const name = interestCity?.name || "";

  return (
    <Dialog open={Boolean(interestCity)} onOpenChange={(open) => !open && closeInterest()}>
      <DialogContent className="sm:max-w-md" data-testid="interest-dialog">
        <DialogHeader className="text-left">
          <DialogTitle className="font-heading text-xl">Register interest in {name}</DialogTitle>
          <DialogDescription>
            Registering interest is optional. We would use it only to tell you when tire-match requests open in {name}.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
          <li>It is not a quote request.</li>
          <li>No shop is contacted.</li>
          <li>It does not reserve anything or promise availability in {name}.</li>
        </ul>
        <div
          className="flex gap-3 rounded-xl border border-[hsl(var(--t4t-warning-border))] bg-[hsl(var(--t4t-warning-bg))] p-3 text-sm text-[hsl(var(--t4t-warning-ink))]"
          data-testid="interest-not-open-notice"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Interest registration isn&rsquo;t open yet. Nothing is collected on this page.</span>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            className="t4t-btn-secondary t4t-focus"
            data-testid="interest-choose-location-button"
            onClick={() => {
              closeInterest();
              openSelector();
            }}
          >
            Choose another location
          </button>
          <button type="button" className="t4t-btn-primary t4t-focus" data-testid="interest-close-button" onClick={closeInterest}>
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
