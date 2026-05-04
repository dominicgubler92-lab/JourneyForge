import { airportSearchSchema } from "@/lib/travel/schemas";
import type { AirportOption } from "@/lib/travel/types";
import { amadeusFetch, getAmadeusToken } from "@/lib/travel/providers/amadeus-client";
import { europeAirports } from "@/lib/travel/providers/airport-data";

type AmadeusLocation = {
  id?: string;
  type?: string;
  subType?: "AIRPORT" | "CITY";
  name?: string;
  iataCode?: string;
  geoCode?: {
    latitude?: number;
    longitude?: number;
  };
  address?: {
    cityName?: string;
    countryName?: string;
  };
};

function fallbackAirports(query: string) {
  const normalized = query.trim().toLowerCase();
  return europeAirports
    .filter((airport) =>
      [
        airport.iataCode,
        airport.name,
        airport.cityName,
        airport.countryName,
      ].some((value) => value.toLowerCase().includes(normalized)),
    )
    .slice(0, 8);
}

function mapAmadeusLocation(location: AmadeusLocation): AirportOption | null {
  const iataCode = location.iataCode?.trim().toUpperCase();
  const latitude = location.geoCode?.latitude;
  const longitude = location.geoCode?.longitude;

  if (!iataCode || latitude === undefined || longitude === undefined) {
    return null;
  }

  return {
    id: location.id ?? `${location.subType?.toLowerCase() ?? "airport"}-${iataCode}`,
    iataCode,
    name: location.name ?? iataCode,
    cityName: location.address?.cityName ?? location.name ?? iataCode,
    countryName: location.address?.countryName ?? "Unknown",
    latitude,
    longitude,
    type: location.subType === "CITY" ? "city" : "airport",
  };
}

export async function searchAirports(query: string) {
  const parsed = airportSearchSchema.parse({ query });
  const token = await getAmadeusToken();

  if (!token) {
    return fallbackAirports(parsed.query);
  }

  const params = new URLSearchParams({
    keyword: parsed.query,
    subType: "CITY,AIRPORT",
    "page[limit]": "8",
  });
  const response = await amadeusFetch(
    `/v1/reference-data/locations?${params.toString()}`,
    token.access_token,
    { next: { revalidate: 86400 } },
  );

  if (!response.ok) {
    return fallbackAirports(parsed.query);
  }

  const payload = (await response.json()) as { data?: AmadeusLocation[] };
  const airports = (payload.data ?? [])
    .map(mapAmadeusLocation)
    .filter((airport): airport is AirportOption => Boolean(airport));

  return airports.length > 0 ? airports : fallbackAirports(parsed.query);
}
