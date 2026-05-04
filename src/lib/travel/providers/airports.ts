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

const queryAliases: Record<string, string[]> = {
  zurich: ["zurich", "zuerich", "zrich", "zrh"],
  geneva: ["geneva", "genf", "geneve", "gva"],
  basel: ["basel", "basle", "bale", "bsl"],
  vienna: ["vienna", "wien", "vie"],
  milan: ["milan", "mailand", "milano", "mxp"],
  rome: ["rome", "rom", "roma", "fco"],
  lisbon: ["lisbon", "lissabon", "lisboa", "lis"],
  prague: ["prague", "prag", "praha", "prg"],
  copenhagen: ["copenhagen", "kopenhagen", "kobenhavn", "cph"],
  paris: ["paris", "cdg"],
  berlin: ["berlin", "ber"],
  athens: ["athens", "athen", "ath"],
  amsterdam: ["amsterdam", "ams"],
  barcelona: ["barcelona", "bcn"],
};

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ü/g, "u")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]/g, "");
}

function searchableValues(airport: AirportOption) {
  const cityKey = normalizeSearch(airport.cityName);
  return [
    airport.iataCode,
    airport.name,
    airport.cityName,
    airport.countryName,
    ...(queryAliases[cityKey] ?? []),
  ].map(normalizeSearch);
}

function fallbackAirports(query: string) {
  const normalized = normalizeSearch(query);

  return europeAirports
    .filter((airport) => searchableValues(airport).some((value) => value.includes(normalized)))
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

  const fallback = fallbackAirports(parsed.query);
  const seen = new Set<string>();
  const combined = [...airports, ...fallback].filter((airport) => {
    if (seen.has(airport.iataCode)) return false;
    seen.add(airport.iataCode);
    return true;
  });

  return combined.length > 0 ? combined : fallback;
}
