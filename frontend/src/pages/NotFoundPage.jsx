import { MapPin } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Seo } from "@/components/site/Seo";
import { useSite } from "@/context/SiteContext";

export default function NotFoundPage() {
  const { openSelector } = useSite();
  return (
    <PageShell>
      <Seo title="Page not found" indexable={false} />
      <section className="t4t-container py-16 sm:py-24" data-testid="not-found-page">
        <div className="max-w-xl rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="not-found-title">We don&rsquo;t have a page for that location</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Tires4Today isn&rsquo;t taking tire-match requests there. You can check the locations we are working on.
          </p>
          <button type="button" onClick={openSelector} className="t4t-btn-primary t4t-focus mt-8 w-full sm:w-auto" data-testid="not-found-choose-city-button">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            Choose your city
          </button>
        </div>
      </section>
    </PageShell>
  );
}
