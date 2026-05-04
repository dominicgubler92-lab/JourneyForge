import type { TripSearchInput } from "@/lib/travel/schemas";
import type { FlightOption, StayOption, TravelProvider } from "@/lib/travel/types";
import { demoTravelProvider } from "@/lib/travel/providers/demo";

type AmadeusToken = {
  access_token: string;
  expires_in: number;
};

async function getToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    next: { revalidate: 60 * 20 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AmadeusToken;
}

async function resolveCityCode(query: string, token: string) {
  const params = new URLSearchParams({
    keyword: query,
    subType: "CITY,AIRPORT",
    "page[limit]": "1",
  });
  const response = await fetch(
    `https://test.api.amadeus.com/v1/reference-data/locations?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    data?: Array<{ iataCode?: string; address?: { cityCode?: string } }>;
  };

  return payload.data?.[0]?.iataCode ?? payload.data?.[0]?.address?.cityCode ?? null;
}

export const amadeusTravelProvider: TravelProvider = {
  name: "Amadeus Self-Service",

  async searchFlights(input: TripSearchInput): Promise<FlightOption[]> {
    const token = await getToken();
    if (!token) {
      return demoTravelProvider.searchFlights(input);
    }

    const [originCode, destinationCode] = await Promise.all([
      resolveCityCode(input.origin, token.access_token),
      resolveCityCode(input.destination, token.access_token),
    ]);

    if (!originCode || !destinationCode) {
      return demoTravelProvider.searchFlights(input);
    }

    const params = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: input.startDate,
      adults: String(input.travelers),
      max: "5",
      currencyCode: "CHF",
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" },
    );

    if (!response.ok) {
      return demoTravelProvider.searchFlights(input);
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id: string;
        price?: { total?: string; currency?: "CHF" | "EUR" | "USD" };
        itineraries?: Array<{
          duration?: string;
          segments?: Array<{
            carrierCode?: string;
            departure?: { iataCode?: string; at?: string };
            arrival?: { iataCode?: string; at?: string };
          }>;
        }>;
      }>;
    };

    const mapped = (payload.data ?? []).map((offer, index) => {
      const itinerary = offer.itineraries?.[0];
      const segments = itinerary?.segments ?? [];
      const first = segments[0];
      const last = segments[segments.length - 1];
      const departure = first?.departure?.at ? new Date(first.departure.at) : null;
      const arrival = last?.arrival?.at ? new Date(last.arrival.at) : null;

      return {
        id: `amadeus-${offer.id}`,
        provider: "Amadeus",
        airline: first?.carrierCode ?? "Carrier",
        route: `${first?.departure?.iataCode ?? originCode} -> ${last?.arrival?.iataCode ?? destinationCode}`,
        departureTime: departure
          ? departure.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
          : "TBD",
        arrivalTime: arrival
          ? arrival.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
          : "TBD",
        duration: itinerary?.duration?.replace("PT", "").toLowerCase() ?? "TBD",
        stops: Math.max(0, segments.length - 1),
        price: {
          amount: Math.round(Number(offer.price?.total ?? 0)),
          currency: offer.price?.currency ?? "CHF",
        },
        score: 96 - index * 4,
        bookingLink: {
          label: "Open flight booking",
          provider: "Amadeus partner search",
          url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`${originCode} to ${destinationCode} ${input.startDate}`)}`,
        },
      } satisfies FlightOption;
    });

    return mapped.length > 0 ? mapped : demoTravelProvider.searchFlights(input);
  },

  async searchStays(input: TripSearchInput): Promise<StayOption[]> {
    return demoTravelProvider.searchStays(input);
  },
};

