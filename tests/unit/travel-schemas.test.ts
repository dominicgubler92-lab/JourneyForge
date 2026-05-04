import { describe, expect, it } from "vitest";
import { airportSearchSchema, dealSearchSchema, tripSearchSchema } from "@/lib/travel/schemas";

describe("tripSearchSchema", () => {
  it("accepts a valid trip search", () => {
    const result = tripSearchSchema.safeParse({
      origin: "Zurich",
      destination: "Lisbon",
      startDate: "2026-07-10",
      endDate: "2026-07-17",
      travelers: 2,
      budget: 2400,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = tripSearchSchema.safeParse({
      origin: "Zurich",
      destination: "Lisbon",
      startDate: "2026-07-17",
      endDate: "2026-07-10",
      travelers: 2,
    });

    expect(result.success).toBe(false);
  });
});

describe("airportSearchSchema", () => {
  it("accepts an airport autocomplete query", () => {
    const result = airportSearchSchema.safeParse({ query: "zur" });

    expect(result.success).toBe(true);
  });

  it("rejects a one-character airport query", () => {
    const result = airportSearchSchema.safeParse({ query: "z" });

    expect(result.success).toBe(false);
  });
});

describe("dealSearchSchema", () => {
  const origin = {
    id: "airport-zrh",
    iataCode: "ZRH",
    name: "Zurich Airport",
    cityName: "Zurich",
    countryName: "Switzerland",
    latitude: 47.4581,
    longitude: 8.5555,
    type: "airport" as const,
  };

  it("accepts a deal search without kids or hotels", () => {
    const result = dealSearchSchema.safeParse({
      origin,
      travelers: 2,
      budget: 1200,
      window: "next_3_months",
      minNights: 3,
      maxNights: 7,
      region: "europe",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid IATA codes", () => {
    const result = dealSearchSchema.safeParse({
      origin: { ...origin, iataCode: "ZH" },
      travelers: 2,
      budget: 1200,
    });

    expect(result.success).toBe(false);
  });
});
