"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import {
  Baby,
  CalendarDays,
  ExternalLink,
  Globe2,
  Hotel,
  Loader2,
  MapPin,
  Plane,
  Save,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AuthPanel } from "@/components/auth/auth-panel";
import { tripSearchSchema, type TripSearchInput } from "@/lib/travel/schemas";
import type { FlightOption, StayOption, TripSearchResult } from "@/lib/travel/types";

type Language = "en" | "de";
type FormInput = z.input<typeof tripSearchSchema>;
type FormValues = z.output<typeof tripSearchSchema>;

const defaultValues: FormValues = {
  origin: "Zurich",
  destination: "Lisbon",
  startDate: "2026-07-10",
  endDate: "2026-07-17",
  travelers: 2,
  kids: 0,
  budget: 2400,
};

const copy = {
  en: {
    planLabel: "JourneyForge",
    title: "Plan your trip",
    subtitle: "Start with the essentials. Compare flights and stays after search.",
    from: "From",
    to: "To",
    start: "Start",
    end: "End",
    travelers: "Travelers",
    kids: "Kids",
    budget: "Budget",
    search: "Search trip",
    searching: "Searching",
    checkFields: "Please check the trip details.",
    planningSurface: "Trip options",
    planningHeadline: "Choose a flight and stay, then book with the provider.",
    liveApis: "Live APIs",
    demoFallback: "Demo fallback",
    flights: "Flights",
    stays: "Stays",
    direct: "Direct",
    stop: "stop",
    rating: "rating",
    score: "Score",
    summary: "Trip summary",
    total: "Estimated total",
    selectedFlight: "Selected flight",
    selectedStay: "Selected stay",
    save: "Save trip",
    signInToSave: "Sign in to save",
    saveLogin: "Sign in to save this trip. You can keep planning without an account.",
    saved: "Trip saved.",
    saveFailed: "Could not save trip.",
    emptySummary: "Search first, then choose one flight and one stay.",
    handoff: "Booking opens on external provider pages. JourneyForge stores your plan but does not process checkout.",
    language: "Language",
  },
  de: {
    planLabel: "JourneyForge",
    title: "Reise planen",
    subtitle: "Starte mit den wichtigsten Daten. Fluege und Unterkuenfte erscheinen nach der Suche.",
    from: "Von",
    to: "Nach",
    start: "Start",
    end: "Ende",
    travelers: "Reisende",
    kids: "Kinder",
    budget: "Budget",
    search: "Reise suchen",
    searching: "Sucht",
    checkFields: "Bitte pruefe die Reisedaten.",
    planningSurface: "Reiseoptionen",
    planningHeadline: "Waehle Flug und Unterkunft, dann buchst du beim Anbieter.",
    liveApis: "Live APIs",
    demoFallback: "Demo-Daten",
    flights: "Fluege",
    stays: "Unterkuenfte",
    direct: "Direkt",
    stop: "Stopp",
    rating: "Bewertung",
    score: "Score",
    summary: "Trip Uebersicht",
    total: "Geschaetzter Gesamtpreis",
    selectedFlight: "Ausgewaehlter Flug",
    selectedStay: "Ausgewaehlte Unterkunft",
    save: "Trip speichern",
    signInToSave: "Zum Speichern anmelden",
    saveLogin: "Melde dich an, um diesen Trip zu speichern. Planen geht auch ohne Konto.",
    saved: "Trip gespeichert.",
    saveFailed: "Trip konnte nicht gespeichert werden.",
    emptySummary: "Suche zuerst und waehle dann einen Flug und eine Unterkunft.",
    handoff: "Die Buchung oeffnet beim externen Anbieter. JourneyForge verarbeitet keine Zahlung.",
    language: "Sprache",
  },
} satisfies Record<Language, Record<string, string>>;

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

async function searchTrips(input: TripSearchInput) {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Search failed.");
  }

  return (await response.json()) as TripSearchResult;
}

function OptionShell({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition ${
        active
          ? "border-accent bg-teal-50 shadow-sm"
          : "border-line bg-surface hover:border-accent/50"
      }`}
    >
      {children}
    </button>
  );
}

function FlightCard({
  flight,
  active,
  labels,
  onSelect,
}: {
  flight: FlightOption;
  active: boolean;
  labels: (typeof copy)[Language];
  onSelect: () => void;
}) {
  return (
    <OptionShell active={active} onClick={onSelect}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-accent-strong">
            <Plane size={16} />
            {flight.airline}
          </div>
          <p className="mt-2 text-xl font-semibold">
            {flight.departureTime} - {flight.arrivalTime}
          </p>
          <p className="mt-1 text-sm text-muted">
            {flight.route} - {flight.duration} -{" "}
            {flight.stops === 0 ? labels.direct : `${flight.stops} ${labels.stop}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {formatMoney(flight.price.amount, flight.price.currency)}
          </p>
          <p className="text-xs font-medium text-muted">
            {labels.score} {flight.score}
          </p>
        </div>
      </div>
    </OptionShell>
  );
}

function StayCard({
  stay,
  active,
  labels,
  onSelect,
}: {
  stay: StayOption;
  active: boolean;
  labels: (typeof copy)[Language];
  onSelect: () => void;
}) {
  return (
    <OptionShell active={active} onClick={onSelect}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-accent-strong">
            <Hotel size={16} />
            {stay.area}
          </div>
          <p className="mt-2 text-xl font-semibold">{stay.name}</p>
          <p className="mt-1 text-sm text-muted">
            {stay.nights} nights - {stay.rating.toFixed(1)} {labels.rating} -{" "}
            {stay.amenities.join(", ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {formatMoney(stay.price.amount, stay.price.currency)}
          </p>
          <p className="text-xs font-medium text-muted">
            {labels.score} {stay.score}
          </p>
        </div>
      </div>
    </OptionShell>
  );
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
      className="flex h-10 items-center gap-1 rounded-lg border border-line bg-surface p-1 shadow-sm"
    >
      <Globe2 size={15} className="ml-1 text-muted" />
      {(["en", "de"] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={language === item}
          onClick={() => setLanguage(item)}
          className={`h-8 rounded-md px-2 text-xs font-semibold transition ${
            language === item
              ? "bg-accent text-white"
              : "text-muted hover:bg-white hover:text-foreground"
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function TripPlanner() {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const labels = copy[language];

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(tripSearchSchema),
    defaultValues,
  });

  const searchMutation = useMutation({
    mutationFn: searchTrips,
    onSuccess(result) {
      setSelectedFlightId(result.flightOptions[0]?.id ?? null);
      setSelectedStayId(result.stayOptions[0]?.id ?? null);
      setSaveMessage(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        throw new Error(labels.saveLogin);
      }

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: form.getValues(),
          selectedFlightId,
          selectedStayId,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? labels.saveFailed);
      }
      return payload as { id: string };
    },
    onSuccess() {
      setSaveMessage(labels.saved);
    },
    onError(error) {
      setSaveMessage(error instanceof Error ? error.message : labels.saveFailed);
    },
  });

  const result = searchMutation.data;
  const selectedFlight = result?.flightOptions.find((flight) => flight.id === selectedFlightId);
  const selectedStay = result?.stayOptions.find((stay) => stay.id === selectedStayId);
  const total = useMemo(() => {
    if (!selectedFlight || !selectedStay) return null;
    return {
      amount: selectedFlight.price.amount + selectedStay.price.amount,
      currency: selectedFlight.price.currency,
    };
  }, [selectedFlight, selectedStay]);

  const onSubmit = form.handleSubmit((values) => {
    searchMutation.mutate(values);
  });
  const searchErrorMessage =
    searchMutation.error instanceof Error
      ? searchMutation.error.message
      : searchMutation.error
        ? "Search failed."
        : null;

  const searchForm = (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      <label className="block xl:col-span-2">
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <MapPin size={15} /> {labels.from}
        </span>
        <input
          {...form.register("origin")}
          className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
          placeholder="Zurich"
        />
      </label>

      <label className="block xl:col-span-2">
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <MapPin size={15} /> {labels.to}
        </span>
        <input
          {...form.register("destination")}
          className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
          placeholder="Lisbon"
        />
      </label>

      <label className="block">
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <CalendarDays size={15} /> {labels.start}
        </span>
        <input
          {...form.register("startDate")}
          type="date"
          className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <CalendarDays size={15} /> {labels.end}
        </span>
        <input
          {...form.register("endDate")}
          type="date"
          className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <Users size={15} /> {labels.travelers}
        </span>
        <input
          {...form.register("travelers")}
          type="number"
          min={1}
          max={8}
          className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <Baby size={15} /> {labels.kids}
        </span>
        <input
          {...form.register("kids")}
          type="number"
          min={0}
          max={6}
          className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-muted">{labels.budget}</span>
        <input
          {...form.register("budget")}
          type="number"
          className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>

      <div className="sm:col-span-2 xl:col-span-7">
        {Object.values(form.formState.errors).length > 0 && (
          <p className="mb-3 rounded-lg bg-rose px-3 py-2 text-sm text-[#60241d]">
            {labels.checkFields}
          </p>
        )}
        {searchErrorMessage && (
          <p className="mb-3 rounded-lg border border-rose bg-rose p-3 text-sm">
            {searchErrorMessage}
          </p>
        )}

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          disabled={searchMutation.isPending}
        >
          {searchMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {searchMutation.isPending ? labels.searching : labels.search}
        </button>
      </div>
    </form>
  );

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">{labels.planLabel}</p>
            <h1 className="text-2xl font-semibold tracking-normal">{labels.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch
            language={language}
            setLanguage={setLanguage}
            label={labels.language}
          />
          <AuthPanel language={language} onUserChange={setCurrentUser} />
        </div>
      </header>

      {!result ? (
        <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-6xl items-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-6"
          >
            <p className="mb-5 text-sm font-medium text-muted">{labels.subtitle}</p>
            {searchForm}
          </motion.div>
        </section>
      ) : (
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 xl:grid-cols-[1fr_340px]">
          <section className="space-y-5">
            <div className="rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-5">
              {searchForm}
            </div>

            <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted">{labels.planningSurface}</p>
                  <h2 className="text-2xl font-semibold tracking-normal">
                    {labels.planningHeadline}
                  </h2>
                </div>
                <span className="rounded-full bg-sky px-3 py-1 text-sm font-medium">
                  {result.providerMetadata.mode === "live" ? labels.liveApis : labels.demoFallback}
                </span>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-line bg-white/70 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <Plane size={19} /> {labels.flights}
                </h3>
                <div className="space-y-3">
                  {result.flightOptions.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      labels={labels}
                      active={flight.id === selectedFlightId}
                      onSelect={() => setSelectedFlightId(flight.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-line bg-white/70 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <Hotel size={19} /> {labels.stays}
                </h3>
                <div className="space-y-3">
                  {result.stayOptions.map((stay) => (
                    <StayCard
                      key={stay.id}
                      stay={stay}
                      labels={labels}
                      active={stay.id === selectedStayId}
                      onSelect={() => setSelectedStayId(stay.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-lg border border-line bg-surface p-5 shadow-sm xl:sticky xl:top-4 xl:h-fit">
            <h2 className="text-xl font-semibold">{labels.summary}</h2>
            {selectedFlight && selectedStay && total ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-sand p-4">
                  <p className="text-sm font-medium text-muted">{labels.total}</p>
                  <p className="text-3xl font-semibold">
                    {formatMoney(total.amount, total.currency)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted">{labels.selectedFlight}</p>
                  <p className="font-semibold">{selectedFlight.airline}</p>
                  <a
                    href={selectedFlight.bookingLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong"
                  >
                    {selectedFlight.bookingLink.label} <ExternalLink size={15} />
                  </a>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted">{labels.selectedStay}</p>
                  <p className="font-semibold">{selectedStay.name}</p>
                  <a
                    href={selectedStay.bookingLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong"
                  >
                    {selectedStay.bookingLink.label} <ExternalLink size={15} />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-accent bg-white px-4 font-semibold text-accent-strong transition hover:bg-teal-50 disabled:opacity-60"
                >
                  {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {currentUser ? labels.save : labels.signInToSave}
                </button>

                {saveMessage && <p className="text-sm text-muted">{saveMessage}</p>}

                <p className="text-xs leading-5 text-muted">{labels.handoff}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted">{labels.emptySummary}</p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
