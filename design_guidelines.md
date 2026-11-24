{
  "brand": {
    "name": "Tires4Today",
    "product": "Tire Match Intake (Checkpoint 1: city-aware landing)",
    "brand_attributes": [
      "trustworthy and plain-spoken",
      "fast and low-friction (feels <2 minutes)",
      "local + practical (city-aware)",
      "honest (no invented numbers, no fake social proof)",
      "winter-safety oriented without fear-mongering"
    ],
    "visual_personality": {
      "style_fusion": [
        "Swiss-style clarity (strong grid, typographic hierarchy)",
        "soft industrial (subtle borders, crisp surfaces)",
        "light ‘winter daylight’ palette with a single high-visibility CTA accent"
      ],
      "avoid": [
        "dark/saturated gradients",
        "purple (AI-ish)",
        "stock photos of shops, brand logos, tire brand marks",
        "testimonials/stats/prices/partner counts"
      ]
    }
  },

  "design_tokens": {
    "css_custom_properties": {
      "where": "/app/frontend/src/index.css (override :root tokens)",
      "notes": [
        "Keep backgrounds solid for reading areas.",
        "Use a mild, large-area hero background wash only (<=20% viewport).",
        "No transparent backgrounds with dark text (use solid surfaces)."
      ],
      "tokens": {
        "--background": "210 33% 99%",
        "--foreground": "222 47% 11%",

        "--card": "0 0% 100%",
        "--card-foreground": "222 47% 11%",

        "--popover": "0 0% 100%",
        "--popover-foreground": "222 47% 11%",

        "--primary": "214 88% 45%",
        "--primary-foreground": "210 40% 98%",

        "--secondary": "210 24% 96%",
        "--secondary-foreground": "222 47% 11%",

        "--muted": "210 24% 96%",
        "--muted-foreground": "215 16% 35%",

        "--accent": "199 89% 92%",
        "--accent-foreground": "222 47% 11%",

        "--destructive": "0 84% 55%",
        "--destructive-foreground": "210 40% 98%",

        "--border": "214 20% 90%",
        "--input": "214 20% 90%",
        "--ring": "214 88% 45%",

        "--radius": "0.75rem",

        "--t4t-ink": "222 47% 11%",
        "--t4t-slate": "215 16% 35%",
        "--t4t-surface": "0 0% 100%",
        "--t4t-surface-2": "210 24% 96%",
        "--t4t-cta": "214 88% 45%",
        "--t4t-cta-hover": "214 88% 40%",
        "--t4t-focus": "199 89% 45%",
        "--t4t-winter-wash-1": "199 89% 92%",
        "--t4t-winter-wash-2": "210 33% 99%",
        "--t4t-warning": "38 92% 50%",
        "--t4t-paused": "0 0% 20%"
      }
    },

    "tailwind_usage": {
      "container": "mx-auto w-full max-w-6xl px-4 sm:px-6",
      "section_padding": "py-12 sm:py-16",
      "card": "rounded-xl border bg-card text-card-foreground shadow-sm",
      "subtle_shadow": "shadow-[0_1px_0_rgba(15,23,42,0.06),0_12px_24px_rgba(15,23,42,0.06)]",
      "focus_ring": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--t4t-focus))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    },

    "texture_and_noise": {
      "rule": "Use noise only as a very subtle overlay on large backgrounds (hero), never on text blocks.",
      "css_snippet": ".t4t-noise::before{content:\"\";position:absolute;inset:0;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.06%22/%3E%3C/svg%3E');mix-blend-mode:multiply;pointer-events:none;border-radius:inherit;}",
      "usage": "Add `relative overflow-hidden t4t-noise` to hero background wrapper."
    }
  },

  "typography": {
    "google_fonts": {
      "heading": {
        "family": "Space Grotesk",
        "weights": ["500", "600", "700"],
        "why": "Feels modern + engineered without being ‘tech bro’; great for short, confident headlines."
      },
      "body": {
        "family": "Inter",
        "weights": ["400", "500", "600"],
        "why": "High legibility on mobile; neutral and trustworthy."
      },
      "mono_optional": {
        "family": "IBM Plex Mono",
        "weights": ["400", "500"],
        "use_for": "staging review bar attribution params only (internal feel)."
      }
    },
    "font_application": {
      "index_css": {
        "body": "font-family: Inter, ui-sans-serif, system-ui;",
        "headings": "Use Tailwind `font-[600] tracking-tight` + `font-heading` utility if you add it; otherwise apply inline className."
      }
    },
    "type_scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-[700] tracking-tight",
      "h2": "text-base md:text-lg font-[600] text-muted-foreground",
      "section_title": "text-2xl sm:text-3xl font-[700] tracking-tight",
      "body": "text-sm sm:text-base leading-relaxed text-foreground",
      "small": "text-xs sm:text-sm text-muted-foreground"
    }
  },

  "layout_and_grid": {
    "global": {
      "mobile_first": true,
      "reading_flow": "Left-aligned content; avoid centered paragraphs except short hero subhead.",
      "max_width": "max-w-6xl",
      "grid": {
        "hero": "grid grid-cols-1 lg:grid-cols-12 gap-8",
        "hero_left": "lg:col-span-7",
        "hero_right": "lg:col-span-5",
        "how_it_works": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        "footer": "grid grid-cols-2 sm:grid-cols-4 gap-6"
      },
      "spacing": {
        "section_gap": "space-y-10 sm:space-y-14",
        "stack_gap": "space-y-4",
        "cta_cluster": "flex flex-col sm:flex-row gap-3"
      }
    },
    "page_templates": {
      "home": ["Header", "Hero (with city selector emphasis)", "How It Works", "FAQ", "Footer"],
      "city": ["Header (city locked + change city)", "Hero (city-aware copy)", "How It Works", "FAQ", "Footer"],
      "tire_match_placeholder": ["Header", "Notice card", "Footer"],
      "not_found": ["Header", "Not found card with city selector", "Footer"]
    }
  },

  "components": {
    "component_path": {
      "shadcn_primary": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/accordion.jsx",
        "/app/frontend/src/components/ui/command.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx",
        "/app/frontend/src/components/ui/sonner.jsx"
      ],
      "recommended_new_local_components_js": [
        "src/components/CitySelector.jsx (Command + Dialog/Sheet)",
        "src/components/CityStateBanner.jsx (live/coming-soon/paused)",
        "src/components/HowItWorks.jsx (step cards)",
        "src/components/ReviewBar.jsx (staging-only internal bar)",
        "src/components/SiteHeader.jsx",
        "src/components/SiteFooter.jsx"
      ]
    },

    "header": {
      "structure": {
        "left": "Wordmark (text-only) + small ‘Ontario/Quebec’ descriptor",
        "center": "(desktop) inline city selector trigger",
        "right": "Primary CTA button (desktop), icon-only CTA (mobile optional)"
      },
      "styles": {
        "wrapper": "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "inner": "mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6",
        "wordmark": "font-[700] tracking-tight text-foreground",
        "city_trigger": "inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm hover:bg-muted",
        "cta": "h-10 px-4 rounded-xl"
      },
      "data_testids": {
        "city_trigger": "city-selector-trigger",
        "cta": "primary-cta-header"
      }
    },

    "city_selector": {
      "pattern": "Command palette grouped list; Dialog on desktop, Sheet on mobile.",
      "grouping": ["Available locations", "Coming soon — register interest"],
      "search": "CommandInput with placeholder ‘Search city…’",
      "empty_state": "No matching cities. Suggest nearest available locations.",
      "row_design": {
        "row": "flex items-center justify-between gap-3",
        "left": "City name + province badge (ON/QC)",
        "right": "Status badge: Available / Coming soon / Paused",
        "tap_target": "min-h-[44px]"
      },
      "badges": {
        "available": "bg-[hsl(var(--t4t-winter-wash-1))] text-foreground border",
        "coming_soon": "bg-[hsl(var(--t4t-warning))]/15 text-foreground border border-[hsl(var(--t4t-warning))]/30",
        "paused": "bg-muted text-muted-foreground border"
      },
      "data_testids": {
        "command_input": "city-selector-search-input",
        "available_group": "city-selector-available-group",
        "coming_group": "city-selector-coming-soon-group",
        "city_option": "city-selector-city-option-<slug>",
        "close": "city-selector-close"
      }
    },

    "hero": {
      "background": {
        "rule": "Hero may use a mild wash gradient <=20% viewport; rest of page solid.",
        "class": "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[hsl(var(--t4t-winter-wash-1))] to-[hsl(var(--t4t-winter-wash-2))]",
        "overlay": "absolute inset-0 opacity-60"
      },
      "copy_rules": {
        "h1": "Winter Tires Installed in {City}",
        "subhead": "Real All-In Prices. Same-Week Booking.",
        "body": "Tell us your vehicle and tire needs. We'll match you with available options from local partner shops and send you a clear all-in installed price.",
        "primary_cta": "Find My Tire Match",
        "trust_line": "No cost to request a quote. All-in pricing includes tires, mounting, balancing, disposal, and taxes."
      },
      "cta_design": {
        "primary_button": "Use shadcn Button with custom radius; add subtle press scale.",
        "secondary": "Optional ghost button: ‘Change location’ (opens city selector)."
      },
      "right_side": {
        "content": "A ‘What you’ll answer’ card (3 bullets) to set expectation (<2 minutes). No numbers.",
        "bullets": ["Vehicle basics", "Tire size / preference", "Timing + contact"],
        "card_class": "rounded-2xl border bg-card p-5 shadow-sm"
      },
      "data_testids": {
        "primary_cta": "primary-cta-hero",
        "secondary_city": "hero-change-city-button"
      }
    },

    "city_state_variants": {
      "live": {
        "behavior": "Show hero + primary CTA enabled.",
        "banner": "Optional subtle badge ‘Available now’ near H1 (not a stat)."
      },
      "planned_onboarding": {
        "hero_override": {
          "headline": "Coming soon — register interest",
          "message": "We're not taking tire-match requests in this location yet. You can register interest, or choose an available location you're willing to visit.",
          "primary_cta": "Register interest",
          "secondary_cta": "Choose another location"
        },
        "styles": {
          "banner": "rounded-xl border bg-[hsl(var(--t4t-warning))]/10 p-4 text-sm",
          "icon": "lucide-react: Clock or MapPin"
        },
        "data_testids": {
          "register": "register-interest-button",
          "choose_location": "choose-location-button"
        }
      },
      "paused": {
        "hero_override": {
          "headline": "Temporarily paused",
          "message": "Tire-match requests are paused in this location right now. Choose an available location you're willing to visit.",
          "primary_cta": "Choose another location"
        },
        "styles": {
          "banner": "rounded-xl border bg-muted p-4 text-sm"
        },
        "data_testids": {
          "choose_location": "paused-choose-location-button"
        }
      }
    },

    "how_it_works": {
      "steps": [
        {
          "title": "Tell us your vehicle & tire needs",
          "desc": "A short intake—just the essentials so we can match correctly.",
          "icon": "Car"
        },
        {
          "title": "We match with local partner shops",
          "desc": "We check availability and fitment with shops in your area.",
          "icon": "MapPin"
        },
        {
          "title": "You get a clear all-in installed price",
          "desc": "One number that includes tires + install + taxes.",
          "icon": "Receipt"
        },
        {
          "title": "Shop confirms the appointment",
          "desc": "Once you pick an option, the shop confirms timing.",
          "icon": "CalendarCheck"
        }
      ],
      "card_style": "rounded-2xl border bg-card p-5 shadow-sm",
      "micro_interaction": "On hover (desktop): translate-y-[-2px] + shadow deepen; on tap: press scale 0.98.",
      "data_testids": {
        "section": "how-it-works-section",
        "step": "how-it-works-step-<index>"
      }
    },

    "faq": {
      "component": "Accordion",
      "guidance": {
        "count": "5–7 max; focus on objections: all-in meaning, timing, what info needed, cancellations, coverage area.",
        "tone": "Direct, no marketing fluff."
      },
      "styles": {
        "wrapper": "rounded-2xl border bg-card",
        "item": "px-4 sm:px-6",
        "trigger": "py-4 text-left text-base font-[600]",
        "content": "pb-4 text-sm sm:text-base text-muted-foreground"
      },
      "data_testids": {
        "section": "faq-section",
        "item": "faq-item-<slug>"
      }
    },

    "footer": {
      "content": {
        "left": "Wordmark + short trust statement (no numbers)",
        "links": ["Available locations", "Coming soon", "Privacy", "Terms"],
        "legal_line": "All-in pricing includes tires, mounting, balancing, disposal, and taxes."
      },
      "styles": {
        "wrapper": "border-t bg-background",
        "inner": "mx-auto max-w-6xl px-4 sm:px-6 py-10",
        "link": "text-sm text-muted-foreground hover:text-foreground"
      },
      "data_testids": {
        "footer": "site-footer",
        "city_link": "footer-city-link-<slug>"
      }
    },

    "staging_review_bar": {
      "visibility": "STAGING ONLY (guard by env var). Must look internal.",
      "purpose": [
        "Switch previewed city state (live / coming soon / paused)",
        "Inspect captured URL attribution params (utm_*, gclid, fbclid, kijiji, etc.)"
      ],
      "styles": {
        "wrapper": "sticky top-0 z-50 border-b bg-[hsl(var(--t4t-paused))] text-white",
        "inner": "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 py-2",
        "label": "text-[11px] uppercase tracking-widest text-white/70",
        "value": "font-mono text-xs",
        "pill": "rounded-full bg-white/10 px-2 py-1 text-xs"
      },
      "controls": {
        "state_switch": "Use shadcn Select or ToggleGroup",
        "attribution_popover": "Use shadcn Popover with ScrollArea"
      },
      "data_testids": {
        "bar": "staging-review-bar",
        "state_switch": "staging-state-switch",
        "attribution_button": "staging-attribution-button",
        "attribution_item": "staging-attribution-item-<key>"
      }
    },

    "buttons": {
      "variants": {
        "primary": {
          "shape": "rounded-xl",
          "surface": "solid CTA blue",
          "classes": "rounded-xl bg-[hsl(var(--t4t-cta))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--t4t-cta-hover))]",
          "motion": "transition-colors duration-150 active:scale-[0.98]"
        },
        "secondary": {
          "classes": "rounded-xl border bg-card hover:bg-muted",
          "motion": "transition-colors duration-150 active:scale-[0.98]"
        },
        "ghost": {
          "classes": "rounded-xl hover:bg-muted",
          "motion": "transition-colors duration-150"
        }
      },
      "a11y": {
        "tap_targets": "min-h-[44px]",
        "focus": "Always visible focus ring using token focus_ring"
      }
    }
  },

  "motion_and_microinteractions": {
    "library": "framer-motion (already available)",
    "principles": [
      "Motion should confirm actions, not decorate.",
      "Respect prefers-reduced-motion.",
      "No parallax that harms readability; keep subtle."
    ],
    "recommended_patterns": {
      "hero_enter": "Fade + slight y (8px) on load for hero text cluster.",
      "step_cards": "Stagger in on scroll (once).",
      "cta": "Press scale 0.98; hover brighten (color only).",
      "city_selector": "Dialog/Sheet uses default shadcn transitions; avoid custom heavy animations."
    },
    "framer_snippet_js": "import { motion, useReducedMotion } from 'framer-motion';\n\nconst useEnter = () => {\n  const reduce = useReducedMotion();\n  return {\n    initial: reduce ? false : { opacity: 0, y: 8 },\n    animate: reduce ? {} : { opacity: 1, y: 0 },\n    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }\n  };\n};"
  },

  "accessibility": {
    "wcag": "AA",
    "requirements": [
      "All text must meet contrast on solid backgrounds.",
      "Keyboard navigable city selector (Command supports).",
      "Visible focus states on all interactive elements.",
      "Use semantic headings (one H1 per page).",
      "Respect prefers-reduced-motion."
    ]
  },

  "images": {
    "rule": "Minimal images for speed; avoid shop photos/logos/brands. Use abstract winter-road textures only as decorative hero background (optional).",
    "image_urls": [
      {
        "category": "hero_background_optional",
        "description": "Abstract winter road / snow texture; use as low-opacity background image behind hero wash.",
        "url": "https://images.unsplash.com/photo-1570416421687-8ce9b853d9e9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMHdpbnRlciUyMHJvYWQlMjB0ZXh0dXJlJTIwbWluaW1hbHxlbnwwfHx8Ymx1ZXwxNzk1NDgxNjMzfDA&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "hero_background_optional",
        "description": "Blue ice abstract texture; can be used as subtle overlay in hero only.",
        "url": "https://images.pexels.com/photos/36222846/pexels-photo-36222846.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      }
    ]
  },

  "instructions_to_main_agent": {
    "implementation_notes": [
      "Remove default CRA App.css centering patterns; do not use `.App { text-align:center }`.",
      "Use shadcn components from /src/components/ui (Accordion, Command, Dialog, Sheet, Button, Badge, Card).",
      "City selector: Dialog on desktop, Sheet on mobile; both share the same Command list component.",
      "No prices, no shop names, no testimonials, no stats anywhere.",
      "All interactive + key informational elements must include `data-testid` (kebab-case).",
      "Use JS files (not TSX) for new components. Named exports for components; default exports for pages."
    ],
    "data_testid_convention": {
      "format": "role-based kebab-case",
      "examples": [
        "data-testid=\"primary-cta-hero\"",
        "data-testid=\"city-selector-city-option-ottawa\"",
        "data-testid=\"faq-item-all-in-pricing\""
      ]
    }
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
