"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import {
  CalendarDays,
  ExternalLink,
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

type FormInput = z.input<typeof tripSearchSchema>;
type FormValues = z.output<typeof tripSearchSchema>;

const defaultValues: FormValues = {
  origin: "Zurich",
  destination: "Lisbon",
  startDate: "2026-07-10",
  endDate: "2026-07-17",
  travelers: 2,
  budget: 2400,
  vibe: "balanced",
};

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
  onSelect,
}: {
  flight: FlightOption;
  active: boolean;
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
          <p className="mt-2 text-xl font-semibold">{flight.departureTime} - {flight.arrivalTime}</p>
          <p className="mt-1 text-sm text-muted">
            {flight.route} - {flight.duration} - {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {formatMoney(flight.price.amount, flight.price.currency)}
          </p>
          <p className="text-xs font-medium text-muted">Score {flight.score}</p>
        </div>
      </div>
    </OptionShell>
  );
}

function StayCard({
  stay,
  active,
  onSelect,
}: {
  stay: StayOption;
  active: boolean;
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
            {stay.nights} nights - {stay.rating.toFixed(1)} rating - {stay.amenities.join(", ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {formatMoney(stay.price.amount, stay.price.currency)}
          </p>
          <p className="text-xs font-medium text-muted">Score {stay.score}</p>
        </div>
      </div>
    </OptionShell>
  );
}

export function TripPlanner() {
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
        throw new Error("Sign in to save this trip. You can keep planning without an account.");
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
        throw new Error(payload.error ?? "Could not save trip.");
      }
      return payload as { id: string };
    },
    onSuccess() {
      setSaveMessage("Trip saved.");
    },
    onError(error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save trip.");
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

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[380px_1fr]">
        <aside className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-white">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">JourneyForge</p>
              <h1 className="text-2xl font-semibold tracking-normal">Trip planner</h1>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-muted">
                <MapPin size={15} /> From
              </span>
              <input
                {...form.register("origin")}
                className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
                placeholder="Zurich"
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-muted">
                <MapPin size={15} /> Destination
              </span>
              <input
                {...form.register("destination")}
                className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
                placeholder="Lisbon"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-medium text-muted">
                  <CalendarDays size={15} /> Start
                </span>
                <input
                  {...form.register("startDate")}
                  type="date"
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-medium text-muted">
                  <CalendarDays size={15} /> End
                </span>
                <input
                  {...form.register("endDate")}
                  type="date"
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Users size={15} /> Travelers
                </span>
                <input
                  {...form.register("travelers")}
                  type="number"
                  min={1}
                  max={8}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-muted">Budget</span>
                <input
                  {...form.register("budget")}
                  type="number"
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-muted">Travel style</span>
              <select
                {...form.register("vibe")}
                className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 outline-none transition focus:border-accent"
              >
                <option value="balanced">Balanced</option>
                <option value="comfort">Comfort</option>
                <option value="budget">Budget</option>
                <option value="design">Design-led</option>
                <option value="family">Family</option>
              </select>
            </label>

            {Object.values(form.formState.errors).length > 0 && (
              <p className="rounded-lg bg-rose px-3 py-2 text-sm text-[#60241d]">
                Please check the highlighted trip details.
              </p>
            )}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Find best options
            </button>
          </form>

          <div className="mt-5">
            <AuthPanel onUserChange={setCurrentUser} />
          </div>
        </aside>

        <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted">Live planning surface</p>
                  <h2 className="text-3xl font-semibold tracking-normal">
                    Build a bookable trip, then finish with the provider.
                  </h2>
                </div>
                {result && (
                  <span className="rounded-full bg-sky px-3 py-1 text-sm font-medium">
                    {result.providerMetadata.mode === "live" ? "Live APIs" : "Demo fallback"}
                  </span>
                )}
              </div>
            </div>

            {searchMutation.error && (
              <p className="rounded-lg border border-rose bg-rose p-4 text-sm">
                {searchMutation.error instanceof Error
                  ? searchMutation.error.message
                  : "Search failed."}
              </p>
            )}

            {!result ? (
              <div className="grid gap-4 md:grid-cols-3">
                {["Search", "Compare", "Assemble"].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-lg border border-line bg-surface p-5"
                  >
                    <p className="text-sm font-medium text-muted">Step {index + 1}</p>
                    <h3 className="mt-2 text-xl font-semibold">{item}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Plan from real inputs, compare normalized options, and keep booking with trusted providers.
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-lg border border-line bg-white/70 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                    <Plane size={19} /> Flight options
                  </h3>
                  <div className="space-y-3">
                    {result.flightOptions.map((flight) => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        active={flight.id === selectedFlightId}
                        onSelect={() => setSelectedFlightId(flight.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-white/70 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                    <Hotel size={19} /> Stay options
                  </h3>
                  <div className="space-y-3">
                    {result.stayOptions.map((stay) => (
                      <StayCard
                        key={stay.id}
                        stay={stay}
                        active={stay.id === selectedStayId}
                        onSelect={() => setSelectedStayId(stay.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-line bg-surface p-5 shadow-sm xl:sticky xl:top-4 xl:h-fit">
            <h2 className="text-xl font-semibold">Trip summary</h2>
            {selectedFlight && selectedStay && total ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-sand p-4">
                  <p className="text-sm font-medium text-muted">Estimated total</p>
                  <p className="text-3xl font-semibold">
                    {formatMoney(total.amount, total.currency)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted">Selected flight</p>
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
                  <p className="text-sm font-medium text-muted">Selected stay</p>
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
                  {currentUser ? "Save trip" : "Sign in to save"}
                </button>

                {saveMessage && <p className="text-sm text-muted">{saveMessage}</p>}

                <p className="text-xs leading-5 text-muted">
                  Booking opens on external provider pages. JourneyForge stores your plan but does not process checkout.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted">
                Run a search and choose a flight and stay to assemble the first JourneyForge trip plan.
              </p>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
