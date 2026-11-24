import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Car, Check, Clock, MapPin, PauseCircle, Ruler, ShieldCheck } from "lucide-react";
import { useCarry } from "@/components/site/PageShell";
import { useSite } from "@/context/SiteContext";

const useEnter = () => {
  const reduce = useReducedMotion();
  return {
    initial: reduce ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  };
};

const HeroFrame = ({ children, testId, state }) => (
  <section className="t4t-container pt-6 sm:pt-10" data-testid={testId} data-city-state={state}>
    <div className="t4t-noise relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[hsl(var(--t4t-wash-1))] to-[hsl(var(--t4t-wash-2))]">
      <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">{children}</div>
    </div>
  </section>
);

const ASKS = [
  { icon: Car, label: "Your vehicle", detail: "Year, make and model" },
  { icon: Ruler, label: "Your tire size", detail: "Or we help you find it" },
  { icon: Clock, label: "Your timing", detail: "And how to reach you" },
];

/** Live city: the approved hero copy. Only rendered when the city state is live. */
export const LiveHero = ({ city }) => {
  const enter = useEnter();
  const carry = useCarry();
  const { openSelector } = useSite();

  return (
    <HeroFrame testId="hero-live" state="live">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
        <motion.div className="lg:col-span-7" {...enter}>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" data-testid="hero-title">
            Winter Tires Installed in {city.name}
          </h1>
          <p className="mt-4 font-heading text-xl font-semibold text-[hsl(var(--t4t-cta))] sm:text-2xl" data-testid="hero-subhead">
            Real All-In Prices. Same-Week Booking.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground sm:text-lg" data-testid="hero-body">
            Tell us your vehicle and tire needs. We&rsquo;ll match you with available options from local partner shops
            and send you a clear all-in installed price.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={carry("/tire-match")} className="t4t-btn-primary t4t-focus w-full sm:w-auto" data-testid="primary-cta-hero">
              Find My Tire Match
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <button type="button" onClick={openSelector} className="t4t-btn-secondary t4t-focus w-full sm:w-auto" data-testid="hero-change-city-button">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Change location
            </button>
          </div>
          <p className="mt-5 flex max-w-xl items-start gap-2 text-sm leading-relaxed text-muted-foreground" data-testid="hero-trust-line">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />
            <span>No cost to request a quote. All-in pricing includes tires, mounting, balancing, disposal, and taxes.</span>
          </p>
        </motion.div>

        <motion.aside className="lg:col-span-5" {...enter} transition={{ ...enter.transition, delay: 0.08 }}>
          <div className="rounded-2xl border bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.06),0_12px_24px_rgba(15,23,42,0.06)]" data-testid="hero-what-we-ask">
            <h2 className="text-lg font-semibold">What we&rsquo;ll ask you</h2>
            <p className="mt-1 text-sm text-muted-foreground">A short form. Just the essentials to match you correctly.</p>
            <ul className="mt-5 space-y-4">
              {ASKS.map(({ icon: Icon, label, detail }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Icon className="h-5 w-5 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-sm text-muted-foreground">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-start gap-2 border-t pt-4 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />
              Your appointment is only set once the shop confirms it.
            </p>
          </div>
        </motion.aside>
      </div>
    </HeroFrame>
  );
};

/** Planned and onboarding cities look the same publicly: no availability is implied. */
export const ComingSoonHero = ({ city }) => {
  const enter = useEnter();
  const { openSelector, openInterest } = useSite();

  return (
    <HeroFrame testId="hero-coming-soon" state="coming_soon">
      <motion.div className="max-w-2xl" {...enter}>
        <span
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--t4t-warning-border))] bg-[hsl(var(--t4t-warning-bg))] px-3 py-1 text-sm font-medium text-[hsl(var(--t4t-warning-ink))]"
          data-testid="coming-soon-badge"
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          Coming soon &mdash; register interest
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl" data-testid="hero-title">
          Tires4Today is not in {city.name} yet
        </h1>
        <p className="mt-5 text-base leading-relaxed text-foreground sm:text-lg" data-testid="not-launched-message">
          We&rsquo;re not taking tire-match requests in this location yet. You can register interest, or choose an
          available location you&rsquo;re willing to visit.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => openInterest(city)} className="t4t-btn-primary t4t-focus w-full sm:w-auto" data-testid="register-interest-button">
            Register interest
          </button>
          <button type="button" onClick={openSelector} className="t4t-btn-secondary t4t-focus w-full sm:w-auto" data-testid="choose-location-button">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Choose another location
          </button>
        </div>
      </motion.div>
    </HeroFrame>
  );
};

export const PausedHero = ({ city }) => {
  const enter = useEnter();
  const { openSelector } = useSite();

  return (
    <HeroFrame testId="hero-paused" state="paused">
      <motion.div className="max-w-2xl" {...enter}>
        <span className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm font-medium text-foreground" data-testid="paused-badge">
          <PauseCircle className="h-4 w-4" aria-hidden="true" />
          Temporarily paused
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl" data-testid="hero-title">
          Tire-match requests are paused in {city.name}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-foreground sm:text-lg" data-testid="paused-message">
          We&rsquo;re not taking new tire-match requests in this location right now. You can choose an available
          location you&rsquo;re willing to visit.
        </p>
        <div className="mt-8">
          <button type="button" onClick={openSelector} className="t4t-btn-primary t4t-focus w-full sm:w-auto" data-testid="paused-choose-location-button">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Choose another location
          </button>
        </div>
      </motion.div>
    </HeroFrame>
  );
};
