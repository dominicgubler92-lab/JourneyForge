import { amadeusTravelProvider } from "@/lib/travel/providers/amadeus";
import { demoTravelProvider } from "@/lib/travel/providers/demo";
import type { TripSearchInput } from "@/lib/travel/schemas";
import type { TripSearchResult } from "@/lib/travel/types";

export async function searchTravel(input: TripSearchInput): Promise<TripSearchResult> {
  const provider =
    process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET
      ? amadeusTravelProvider
      : demoTravelProvider;

  const [flightOptions, stayOptions] = await Promise.all([
    provider.searchFlights(input),
    provider.searchStays(input),
  ]);

  const usingLiveFlights = flightOptions.some((option) => option.provider === "Amadeus");

  return {
    flightOptions,
    stayOptions,
    providerMetadata: {
      mode: usingLiveFlights ? "live" : "demo",
      providers: Array.from(
        new Set([...flightOptions, ...stayOptions].map((option) => option.provider)),
      ),
      generatedAt: new Date().toISOString(),
      notes: [
        usingLiveFlights
          ? "Live Amadeus flight data is enabled. Stays use the normalized provider adapter until hotel credentials are configured."
          : "Demo data is active because live provider credentials are not configured.",
        "Booking is handed off through external provider links; JourneyForge does not process payments.",
      ],
    },
  };
}

