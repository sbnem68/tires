import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_STYLES = {
  planned: "bg-slate-100 text-slate-700 border-slate-300",
  onboarding: "bg-amber-100 text-amber-800 border-amber-300",
  live: "bg-emerald-100 text-emerald-800 border-emerald-300",
  paused: "bg-rose-100 text-rose-800 border-rose-300",
};

const Stat = ({ label, value, hint, testId }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-slate-900" data-testid={testId}>{value}</div>
    {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  </div>
);

const Section = ({ title, note, children }) => (
  <section className="mt-10">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {note && <p className="mt-1 max-w-3xl text-sm text-slate-600">{note}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

// Checkpoint 0 only: an internal review page for the architecture. Not a customer-facing page.
const ArchitectureReview = () => {
  const [health, setHealth] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/health`).then((r) => setHealth(r.data)).catch(() => setHealth({ status: "error" }));
    axios
      .get(`${API}/system/architecture`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.status === 404 ? "hidden" : "failed"));
  }, []);

  const healthy = health?.status === "ok";

  return (
    <div className="min-h-screen bg-slate-50 text-left text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Tires4Today &middot; Staging &middot; Internal
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900" data-testid="page-title">
            Checkpoint 0 &mdash; Architecture review
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Foundation only: database schema, migrations and the location directory seed. No intake form,
            offers, admin dashboard or notifications exist yet. This page reads the live staging database.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span
              data-testid="health-badge"
              className={`rounded-full border px-3 py-1 font-medium ${
                health === null
                  ? "border-slate-300 bg-slate-100 text-slate-600"
                  : healthy
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                  : "border-rose-300 bg-rose-100 text-rose-800"
              }`}
            >
              {health === null ? "Checking API\u2026" : healthy ? "API + PostgreSQL connected" : "API or database unavailable"}
            </span>
            {healthy && (
              <>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1" data-testid="migration-badge">
                  Migration revision {health.migration_revision}
                </span>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1" data-testid="env-badge">
                  Environment: {health.environment}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {error === "hidden" && (
          <p className="mt-10 rounded-lg border border-slate-200 bg-white p-6 text-sm" data-testid="arch-hidden">
            The architecture review is not available in this environment.
          </p>
        )}
        {error === "failed" && (
          <p className="mt-10 rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800" data-testid="arch-error">
            Could not load the architecture data. Check that the API is running and migrations are applied.
          </p>
        )}
        {!data && !error && <p className="mt-10 text-sm text-slate-500" data-testid="arch-loading">Loading schema and seed data&hellip;</p>}

        {data && (
          <>
            <Section
              title="Location directory seed"
              note="Planning prospect counts are supplied planning figures for a whole market group. They are not verified listings, not partner counts, and are never split per city."
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Market groups" value={data.totals.market_groups} testId="total-groups" />
                <Stat label="Cities" value={data.totals.cities} hint="All seeded as planned" testId="total-cities" />
                <Stat label="Toronto subareas" value={data.totals.subareas} hint="Not launch cities" testId="total-subareas" />
                <Stat label="Planning prospects" value={data.totals.planning_prospects} hint="Group-level metadata, unverified" testId="total-planning" />
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm" data-testid="market-groups-table">
                  <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Tier</th>
                      <th className="px-3 py-2">Market group</th>
                      <th className="px-3 py-2">Planning count (group)</th>
                      <th className="px-3 py-2">Cities &rarr; launch status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.market_groups.map((g) => (
                      <tr key={g.slug} className="align-top" data-testid={`group-row-${g.slug}`}>
                        <td className="px-3 py-3 text-slate-500">{g.priority_order}</td>
                        <td className="px-3 py-3">Tier {g.tier}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-900">{g.name}</div>
                          {g.notes && <div className="mt-1 max-w-xs text-xs text-amber-700">{g.notes}</div>}
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold">{g.planning_prospect_count}</span>
                          <span className="ml-2 text-xs text-slate-500">{g.count_verified ? "verified" : "unverified"}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-2">
                            {g.cities.map((c) => (
                              <div key={c.slug} data-testid={`city-${c.slug}`}>
                                <span className="font-medium">{c.name}</span>
                                <span className="ml-1 text-xs text-slate-500">
                                  {c.province_code} &middot; {c.supported_locales.join(" / ")}
                                </span>
                                <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[c.launch_status]}`}>
                                  {c.launch_status}
                                </span>
                                {c.subareas.length > 0 && (
                                  <div className="mt-1 text-xs text-slate-500">Subareas: {c.subareas.join(", ")}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="Business records"
              note="The seed creates location metadata only. No fictional prospects, partners, offers, leads or installs exist."
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(data.record_counts).map(([k, v]) => (
                  <Stat key={k} label={k.replace("_", " ")} value={v} testId={`count-${k}`} />
                ))}
              </div>
            </Section>

            <Section title="Province configuration" note="Quebec is configured separately from Ontario. Nothing is approved for launch yet.">
              <div className="grid gap-3 sm:grid-cols-2">
                {data.provinces.map((p) => (
                  <div key={p.code} className="rounded-lg border border-slate-200 bg-white p-4 text-sm" data-testid={`province-${p.code}`}>
                    <div className="font-semibold text-slate-900">{p.name} ({p.code})</div>
                    <div className="mt-2">Default locale: {p.default_locale}</div>
                    <div>Supported: {p.supported_locales.join(", ")}</div>
                    <div>Tax components: {p.tax_components.map((t) => `${t.name} ${(Number(t.rate) * 100).toFixed(3).replace(/\.?0+$/, "")}%`).join(" + ")}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Tax settings verified: {p.tax_config_verified ? "yes" : "no"} &middot; Consent wording approved:{" "}
                      {p.consent_wording_approved ? "yes" : "no"} &middot; Privacy wording approved: {p.privacy_wording_approved ? "yes" : "no"}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title={`Database schema (${data.tables.length} tables)`}
              note="Read from PostgreSQL after migrations. FK columns show the table they reference."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {data.tables.map((t) => (
                  <details key={t.name} className="rounded-lg border border-slate-200 bg-white" data-testid={`table-${t.name}`}>
                    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">
                      {t.name}
                      <span className="ml-2 font-normal text-slate-500">{t.columns.length} columns</span>
                    </summary>
                    <ul className="border-t border-slate-100 px-4 py-3 font-mono text-xs leading-6">
                      {t.columns.map((c) => (
                        <li key={c.name} className="flex flex-wrap gap-x-2">
                          <span className="text-slate-900">{c.name}</span>
                          <span className="text-slate-500">{c.type}{c.nullable ? "" : " NOT NULL"}</span>
                          {c.primary_key && <span className="text-indigo-700">PK</span>}
                          {c.references && <span className="text-emerald-700">&rarr; {c.references}</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ArchitectureReview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
