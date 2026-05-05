"use client";

import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Globe2,
  Loader2,
  MapPin,
  Minus,
  Plane,
  Plus,
  Radar,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { DealGlobe } from "@/components/globe/deal-globe";
import type { AirportOption, DealOption, DealSearchResult } from "@/lib/travel/types";

type Language = "en" | "de";
type ProviderStatus = {
  activeProvider?: "skyscanner" | "amadeus" | "demo";
  activeModeHint: "live-ready" | "demo-fallback";
  providers: Array<{
    id: string;
    label: string;
    configured: boolean;
    environment: "test" | "production" | "custom";
    modeHint: "live-ready" | "demo-fallback" | "needs-approval" | "legacy-ready" | "legacy-disabled";
  }>;
};

const defaultAirport: AirportOption = {
  id: "airport-zrh",
  iataCode: "ZRH",
  name: "Zurich Airport",
  cityName: "Zurich",
  countryName: "Switzerland",
  latitude: 47.4581,
  longitude: 8.5555,
  type: "airport",
};

const copy = {
  en: {
    brand: "JourneyForge",
    title: "Find the cheapest trip from your airport.",
    subtitle: "Pick a departure airport, set a rough budget and scan Europe for flexible flight deals.",
    airport: "Airport",
    airportPlaceholder: "Search Zurich, Basel, Geneva...",
    travelers: "Travelers",
    budget: "Budget",
    timeframe: "Timeframe",
    timeframeValue: "Next 3 months, 3-7 nights",
    search: "Find deals",
    searching: "Searching",
    selectAirport: "Select an airport first.",
    noAirports: "No airports found.",
    deals: "Flight deals",
    emptyDeals: "Search to reveal flexible flight deals.",
    from: "from",
    nights: "nights",
    direct: "Direct",
    stop: "stop",
    score: "Score",
    live: "Live",
    demo: "Demo",
    providerReady: "Skyscanner ready",
    providerLegacy: "Amadeus legacy",
    providerDemo: "Demo fallback",
    demoCaveat: "Demo fallback is sorted by estimated sample fares. Add Skyscanner API access for live indicative prices.",
    cheapestNow: "Cheapest visible deals",
    language: "Language",
    origin: "Origin locked",
  },
  de: {
    brand: "JourneyForge",
    title: "Finde die guenstigste Reise ab deinem Flughafen.",
    subtitle: "Waehle den Startflughafen, setze ein grobes Budget und entdecke flexible Europa-Deals.",
    airport: "Flughafen",
    airportPlaceholder: "Suche Zuerich, Basel, Genf...",
    travelers: "Reisende",
    budget: "Budget",
    timeframe: "Zeitraum",
    timeframeValue: "Naechste 3 Monate, 3-7 Naechte",
    search: "Deals finden",
    searching: "Sucht",
    selectAirport: "Waehle zuerst einen Flughafen.",
    noAirports: "Keine Flughaefen gefunden.",
    deals: "Flugdeals",
    emptyDeals: "Starte eine Suche, um flexible Flugdeals zu sehen.",
    from: "ab",
    nights: "Naechte",
    direct: "Direkt",
    stop: "Stopp",
    score: "Score",
    live: "Live",
    demo: "Demo",
    providerReady: "Skyscanner bereit",
    providerLegacy: "Amadeus Legacy",
    providerDemo: "Demo-Fallback",
    demoCaveat: "Demo-Fallback ist nach geschaetzten Beispieldaten sortiert. Fuer echte Skyscanner-Preise API-Zugang setzen.",
    cheapestNow: "Guenstigste sichtbare Deals",
    language: "Sprache",
    origin: "Start fixiert",
  },
} satisfies Record<Language, Record<string, string>>;

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[’']/g, "'");
}

async function fetchAirports(query: string) {
  const response = await fetch(`/api/airports?query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { airports: AirportOption[] };
  return payload.airports;
}

async function fetchProviderStatus() {
  const response = await fetch("/api/providers/status");

  if (!response.ok) {
    throw new Error("Provider status unavailable.");
  }

  return (await response.json()) as ProviderStatus;
}

async function searchDeals(input: {
  origin: AirportOption;
  travelers: number;
  budget: number;
}) {
  const response = await fetch("/api/deals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      window: "next_3_months",
      minNights: 3,
      maxNights: 7,
      region: "europe",
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ?? "Deal search failed.");
  }

  return payload as DealSearchResult;
}

function LanguageSwitch({
  language,
  setLanguage,
  label,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
  label: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex h-10 items-center gap-1 rounded-lg border border-white/12 bg-white/8 p-1 text-white shadow-sm backdrop-blur"
    >
      <Globe2 size={15} className="ml-1 text-white/70" />
      {(["en", "de"] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={language === item}
          onClick={() => setLanguage(item)}
          className={`h-8 rounded-md px-2 text-xs font-semibold transition ${
            language === item ? "bg-white text-[#102a2c]" : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function DealCard({ deal, labels }: { deal: DealOption; labels: (typeof copy)[Language] }) {
  return (
    <a
      href={deal.bookingLink.url}
      target="_blank"
      rel="noreferrer"
      className="group grid gap-4 rounded-lg border border-white/12 bg-white/[0.07] p-4 text-left text-white shadow-sm backdrop-blur transition hover:border-[#f2c14e]/70 hover:bg-white/[0.11] sm:grid-cols-[1fr_auto]"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#f2c14e] px-2 py-1 text-xs font-bold text-[#172624]">
            {deal.destinationIata}
          </span>
          <p className="text-lg font-semibold">
            {deal.destinationName}, {deal.countryName}
          </p>
        </div>
        <p className="mt-2 text-sm text-white/62">
          {deal.departureDate} - {deal.returnDate} - {deal.nights} {labels.nights} -{" "}
          {deal.stops === 0 ? labels.direct : `${deal.stops} ${labels.stop}`}
        </p>
      </div>
      <div className="flex items-end justify-between gap-5 sm:block sm:text-right">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{labels.from}</p>
          <p className="text-2xl font-semibold">{formatMoney(deal.price.amount, deal.price.currency)}</p>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold text-[#f2c14e]">
          {labels.score} {deal.score}
          <ArrowUpRight size={17} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </a>
  );
}

export function TripPlanner() {
  const [language, setLanguage] = useState<Language>("en");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [airportQuery, setAirportQuery] = useState(defaultAirport.cityName);
  const [airportResults, setAirportResults] = useState<AirportOption[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<AirportOption | null>(defaultAirport);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(1200);
  const [airportOpen, setAirportOpen] = useState(false);
  const globePanelRef = useRef<HTMLDivElement>(null);
  const labels = copy[language];

  const airportMutation = useMutation({
    mutationFn: fetchAirports,
    onSuccess(results) {
      setAirportResults(results);
      setAirportOpen(true);
    },
  });
  const mutateAirports = airportMutation.mutate;

  const dealMutation = useMutation({
    mutationFn: searchDeals,
  });
  const providerStatusQuery = useQuery({
    queryKey: ["provider-status"],
    queryFn: fetchProviderStatus,
    staleTime: 60_000,
  });

  useEffect(() => {
    const query = airportQuery.trim();

    if (query.length < 2 || selectedAirport?.cityName === query || selectedAirport?.iataCode === query.toUpperCase()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      mutateAirports(query);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [airportQuery, selectedAirport, mutateAirports]);

  const deals = dealMutation.data?.deals ?? [];
  const modeLabel = dealMutation.data?.providerMetadata.mode === "live" ? labels.live : labels.demo;
  const activeProvider = providerStatusQuery.data?.activeProvider;
  const providerIsReady = providerStatusQuery.data?.activeModeHint === "live-ready";
  const providerLabel =
    activeProvider === "skyscanner"
      ? labels.providerReady
      : activeProvider === "amadeus"
        ? labels.providerLegacy
        : labels.providerDemo;
  const origin = dealMutation.data?.origin ?? selectedAirport ?? defaultAirport;
  const airportQueryLength = airportQuery.trim().length;
  const shouldShowNoAirports =
    airportOpen &&
    airportQueryLength >= 2 &&
    !airportMutation.isPending &&
    airportMutation.data !== undefined &&
    airportResults.length === 0;
  const dealCount = useMemo(() => deals.length.toString().padStart(2, "0"), [deals.length]);

  function submitSearch() {
    if (!selectedAirport) {
      dealMutation.reset();
      return;
    }

    dealMutation.mutate({
      origin: selectedAirport,
      travelers,
      budget,
    });
  }

  function selectAirport(airport: AirportOption) {
    setSelectedAirport(airport);
    setAirportQuery(`${airport.cityName} (${airport.iataCode})`);
    setAirportOpen(false);
    globePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071c1f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(242,193,78,0.16),transparent)]" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-[#f2c14e] text-[#102a2c] shadow-sm">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/62">{labels.brand}</p>
            <p className="text-xs uppercase tracking-[0.24em] text-[#f2c14e]">Deal Radar</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch language={language} setLanguage={setLanguage} label={labels.language} />
          <AuthPanel language={language} onUserChange={setCurrentUser} />
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-8 px-4 pb-10 pt-2 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.78fr)] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 py-2 text-sm font-semibold text-white/70 backdrop-blur">
            <Radar size={16} className="text-[#f2c14e]" />
            {labels.timeframeValue}
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-white sm:text-6xl">
            {labels.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/66 sm:text-lg">{labels.subtitle}</p>

          <div className="mt-8 rounded-lg border border-white/14 bg-[#0b282b]/82 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_150px]">
              <div className="relative">
                <label className="text-sm font-semibold text-white/70" htmlFor="airport-search">
                  {labels.airport}
                </label>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/14 bg-white px-3 text-[#102a2c] shadow-sm focus-within:border-[#f2c14e]">
                  <MapPin size={18} className="text-[#1a7472]" />
                  <input
                    id="airport-search"
                    value={airportQuery}
                    onChange={(event) => {
                      setAirportQuery(event.target.value);
                      setSelectedAirport(null);
                    }}
                    onFocus={() => setAirportOpen(airportResults.length > 0)}
                    placeholder={labels.airportPlaceholder}
                    className="h-full min-w-0 flex-1 bg-transparent outline-none"
                  />
                  {airportMutation.isPending && <Loader2 size={18} className="animate-spin text-[#1a7472]" />}
                </div>

                {airportOpen && (
                  <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-white/14 bg-white p-2 text-[#102a2c] shadow-2xl">
                    {shouldShowNoAirports ? (
                      <p className="px-3 py-2 text-sm text-[#62716e]">{labels.noAirports}</p>
                    ) : (
                      airportResults.map((airport) => (
                        <button
                          key={airport.id}
                          type="button"
                          onClick={() => selectAirport(airport)}
                          className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left transition hover:bg-[#e8f4ef]"
                        >
                          <span>
                            <span className="block font-semibold">{airport.name}</span>
                            <span className="text-sm text-[#62716e]">
                              {airport.cityName}, {airport.countryName}
                            </span>
                          </span>
                          <span className="rounded-md bg-[#102a2c] px-2 py-1 text-xs font-bold text-white">
                            {airport.iataCode}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-white/70">{labels.travelers}</label>
                <div className="mt-2 flex h-14 items-center justify-between rounded-lg border border-white/14 bg-white px-2 text-[#102a2c] shadow-sm">
                  <button
                    type="button"
                    aria-label="Decrease travelers"
                    onClick={() => setTravelers((value) => Math.max(1, value - 1))}
                    className="flex size-10 items-center justify-center rounded-md hover:bg-[#e8f4ef]"
                  >
                    <Minus size={17} />
                  </button>
                  <div className="flex items-center gap-2 font-semibold">
                    <Users size={18} className="text-[#1a7472]" />
                    {travelers}
                  </div>
                  <button
                    type="button"
                    aria-label="Increase travelers"
                    onClick={() => setTravelers((value) => Math.min(8, value + 1))}
                    className="flex size-10 items-center justify-center rounded-md hover:bg-[#e8f4ef]"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold text-white/70" htmlFor="budget">
                    {labels.budget}
                  </label>
                  <span className="text-xl font-semibold text-[#f2c14e]">{formatMoney(budget, "CHF")}</span>
                </div>
                <input
                  id="budget"
                  type="range"
                  min={300}
                  max={5000}
                  step={50}
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="mt-3 h-2 w-full accent-[#f2c14e]"
                />
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-white/54">
                  <span className="rounded-md border border-white/12 px-2 py-1">{labels.timeframe}</span>
                  <span className="rounded-md border border-white/12 px-2 py-1">{labels.timeframeValue}</span>
                  <span
                    className={`rounded-md border px-2 py-1 ${
                      providerIsReady
                        ? "border-[#f2c14e]/55 text-[#f2c14e]"
                        : "border-white/12 text-white/54"
                    }`}
                  >
                    {providerLabel}
                  </span>
                  {selectedAirport && (
                    <span className="rounded-md border border-white/12 px-2 py-1">
                      {labels.origin}: {selectedAirport.iataCode}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={submitSearch}
                disabled={dealMutation.isPending || !selectedAirport}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f2c14e] px-5 font-bold text-[#102a2c] shadow-lg shadow-black/20 transition hover:bg-[#ffcf63] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dealMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                {dealMutation.isPending ? labels.searching : labels.search}
              </button>
            </div>

            {!selectedAirport && <p className="mt-3 text-sm text-[#f2c14e]">{labels.selectAirport}</p>}
            {dealMutation.error instanceof Error && (
              <p className="mt-3 rounded-lg border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">
                {dealMutation.error.message}
              </p>
            )}
          </div>
        </motion.div>

        <div
          ref={globePanelRef}
          className="relative min-h-[460px] overflow-hidden rounded-lg border border-white/12 bg-[#0d262a]/55 shadow-2xl shadow-black/20 lg:min-h-[680px]"
        >
          <DealGlobe origin={origin} deals={deals} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
            <div className="rounded-lg border border-white/12 bg-[#071c1f]/76 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">{labels.deals}</p>
                  <p className="text-3xl font-semibold">{dealCount}</p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-[#102a2c]">{modeLabel}</span>
              </div>
              <p className="mt-2 text-sm text-white/58">
                {origin ? `${origin.cityName} (${origin.iataCode})` : labels.emptyDeals}
              </p>
              {deals.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    {labels.cheapestNow}
                  </p>
                  <div className="space-y-2">
                    {deals.slice(0, 3).map((deal) => (
                      <div key={`compact-${deal.id}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-white">
                          {deal.destinationName} ({deal.destinationIata})
                        </span>
                        <span className="font-semibold text-[#f2c14e]">
                          {formatMoney(deal.price.amount, deal.price.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {dealMutation.data?.providerMetadata.mode === "demo" && (
                    <p className="mt-3 text-xs leading-5 text-white/50">{labels.demoCaveat}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Plane size={22} className="text-[#f2c14e]" />
            {labels.deals}
          </h2>
          {dealMutation.data && (
            <span className="rounded-md border border-white/12 bg-white/8 px-3 py-1 text-sm font-semibold text-white/62">
              {modeLabel}
            </span>
          )}
        </div>

        {deals.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} labels={labels} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/12 bg-white/[0.06] p-6 text-white/62">
            {labels.emptyDeals}
          </div>
        )}
      </section>
      {currentUser && <span className="sr-only">Signed in as {currentUser.email}</span>}
    </main>
  );
}
