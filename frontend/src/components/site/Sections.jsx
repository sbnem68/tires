import { CalendarCheck, Car, MapPin, Receipt } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const STEPS = [
  { icon: Car, title: "Tell us your vehicle and tire needs", desc: "A short form with just the essentials, so we can match you correctly." },
  { icon: MapPin, title: "We check with local partner shops", desc: "We look for options that fit your vehicle from partner shops in the city you choose." },
  { icon: Receipt, title: "You get a clear all-in installed price", desc: "One price that includes tires, mounting, balancing, disposal, and taxes." },
  { icon: CalendarCheck, title: "The shop confirms your appointment", desc: "Your appointment is set only after the shop confirms availability and timing." },
];

export const HowItWorks = () => (
  <section className="t4t-container py-12 sm:py-16" data-testid="how-it-works-section" aria-labelledby="how-it-works-title">
    <h2 id="how-it-works-title" className="text-2xl font-bold tracking-tight sm:text-3xl">How It Works</h2>
    <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map(({ icon: Icon, title, desc }, index) => (
        <li
          key={title}
          className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
          data-testid={`how-it-works-step-${index + 1}`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--t4t-wash-1))]">
              <Icon className="h-5 w-5 text-[hsl(var(--t4t-cta))]" aria-hidden="true" />
            </span>
            <span className="font-heading text-sm font-semibold text-muted-foreground">Step {index + 1}</span>
          </div>
          <h3 className="mt-5 text-lg font-semibold leading-snug">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </li>
      ))}
    </ol>
  </section>
);

const FAQS = [
  {
    slug: "all-in-pricing",
    q: "What does \u201call-in\u201d pricing mean?",
    a: "The price you are quoted includes the tires, mounting, balancing, disposal of your old tires, and taxes. It is the installed price.",
  },
  {
    slug: "cost-to-request",
    q: "Does it cost anything to request a quote?",
    a: "No. There is no cost to request a quote.",
  },
  {
    slug: "who-installs",
    q: "Who installs the tires?",
    a: "A local partner shop in the city you choose. Tires4Today matches your request with a partner shop; the shop supplies and installs the tires.",
  },
  {
    slug: "appointment",
    q: "When is my appointment confirmed?",
    a: "Only after the shop confirms availability and a time. We do not promise an appointment before the shop has confirmed it.",
  },
  {
    slug: "what-info",
    q: "What information do I need?",
    a: "Your vehicle\u2019s year, make and model, and your tire size if you know it. The size is printed on the sidewall of your current tires. If you are not sure, we can help you find it.",
  },
  {
    slug: "my-city",
    q: "Is Tires4Today available in my city?",
    a: "Use the city selector at the top of the page. Cities marked \u201cComing soon\u201d are not taking tire-match requests yet.",
  },
];

export const Faq = () => (
  <section className="t4t-container pb-4 pt-4 sm:pb-8" data-testid="faq-section" aria-labelledby="faq-title">
    <h2 id="faq-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Frequently Asked Questions</h2>
    <Accordion type="single" collapsible className="mt-8 rounded-2xl border bg-card">
      {FAQS.map(({ slug, q, a }) => (
        <AccordionItem key={slug} value={slug} className="px-4 last:border-b-0 sm:px-6" data-testid={`faq-item-${slug}`}>
          <AccordionTrigger className="py-5 text-left text-base font-semibold" data-testid={`faq-trigger-${slug}`}>
            {q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base" data-testid={`faq-answer-${slug}`}>
            {a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);
