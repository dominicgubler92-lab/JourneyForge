import { dealSearchSchema, type DealSearchInput } from "@/lib/travel/schemas";
import type { DealOption, DealSearchResult, Money } from "@/lib/travel/types";
import { amadeusFetch, getAmadeusToken } from "@/lib/travel/providers/amadeus-client";
import { europeAirports, findAirportByIata } from "@/lib/travel/providers/airport-data";

type AmadeusDestination = {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  price?: {
    total?: string;
  };
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nightsBetween(departureDate: string, returnDate: string) {
  const departure = new Date(`${departureDate}T00:00:00Z`);
  const arrival = new Date(`${returnDate}T00:00:00Z`);
  return Math.max(1, Math.round((arrival.getTime() - departure.getTime()) / 86400000));
}

function bookingLink(originIata: string, destinationIata: string, departureDate: string, returnDate: string) {
  const query = `${originIata} to ${destinationIata} ${departureDate} ${returnDate}`;
  return {
    label: "Open flight search",
    provider: "Google Flights",
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`,
  };
}

function makeDeal(
  input: DealSearchInput,
  destinationIata: string,
  price: number,
  index: number,
  departureDate?: string,
  returnDate?: string,
): DealOption | null {
  const destination = findAirportByIata(destinationIata);

  if (!destination || destination.iataCode === input.origin.iataCode) {
    return null;
  }

  const departure = departureDate ?? iso(addDays(new Date(), 21 + index * 6));
  const ret = returnDate ?? iso(addDays(new Date(`${departure}T00:00:00Z`), input.minNights + (index % 5)));
  const nights = nightsBetween(departure, ret);
  const amount = Math.round(price * input.travelers);
  const currency: Money["currency"] = "CHF";

  if (amount > input.budget) {
    return null;
  }

  return {
    id: `deal-${input.origin.iataCode}-${destination.iataCode}-${departure}`,
    provider: "JourneyForge demo fares",
    originIata: input.origin.iataCode,
    destinationIata: destination.iataCode,
    destinationName: destination.cityName,
    countryName: destination.countryName,
    latitude: destination.latitude,
    longitude: destination.longitude,
    departureDate: departure,
    returnDate: ret,
    nights,
    travelers: input.travelers,
    stops: index % 3 === 0 ? 1 : 0,
    price: { amount, currency },
    score: Math.max(70, 98 - index * 3 - (index % 3) * 2),
    bookingLink: bookingLink(input.origin.iataCode, destination.iataCode, departure, ret),
  };
}

function demoDeals(input: DealSearchInput): DealSearchResult {
  const seed = input.origin.iataCode.charCodeAt(0) + input.origin.iataCode.charCodeAt(1);
  const candidates = europeAirports
    .filter((airport) => airport.iataCode !== input.origin.iataCode)
    .map((airport, index) => ({
      iataCode: airport.iataCode,
      price: 120 + ((seed + index * 37) % 260),
    }));

  const deals = candidates
    .map((candidate, index) => makeDeal(input, candidate.iataCode, candidate.price, index))
    .filter((deal): deal is DealOption => Boolean(deal))
    .sort((a, b) => a.price.amount - b.price.amount)
    .slice(0, 8);

  return {
    origin: input.origin,
    deals,
    providerMetadata: {
      mode: "demo",
      providers: ["JourneyForge demo fares"],
      generatedAt: new Date().toISOString(),
      notes: ["Demo data is used when Amadeus credentials or live inspiration results are unavailable."],
    },
  };
}

async function liveDeals(input: DealSearchInput): Promise<DealOption[]> {
  const token = await getAmadeusToken();

  if (!token) {
    return [];
  }

  const start = addDays(new Date(), 1);
  const end = addDays(start, 90);
  const params = new URLSearchParams({
    origin: input.origin.iataCode,
    departureDate: `${iso(start)},${iso(end)}`,
    duration: `${input.minNights},${input.maxNights}`,
    maxPrice: String(input.budget),
    currency: "CHF",
  });

  const response = await amadeusFetch(
    `/v1/shopping/flight-destinations?${params.toString()}`,
    token.access_token,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { data?: AmadeusDestination[] };

  return (payload.data ?? [])
    .map((item, index) =>
      makeDeal(
        input,
        item.destination ?? "",
        Number(item.price?.total ?? 0),
        index,
        item.departureDate,
        item.returnDate,
      ),
    )
    .filter((deal): deal is DealOption => Boolean(deal))
    .map((deal) => ({ ...deal, provider: "Amadeus Flight Inspiration" }))
    .sort((a, b) => a.price.amount - b.price.amount)
    .slice(0, 8);
}

export async function searchDeals(input: DealSearchInput): Promise<DealSearchResult> {
  const parsed = dealSearchSchema.parse(input);
  const deals = await liveDeals(parsed);

  if (deals.length === 0) {
    return demoDeals(parsed);
  }

  return {
    origin: parsed.origin,
    deals,
    providerMetadata: {
      mode: "live",
      providers: ["Amadeus Flight Inspiration"],
      generatedAt: new Date().toISOString(),
      notes: ["Prices are inspiration fares and may change on provider pages."],
    },
  };
}
