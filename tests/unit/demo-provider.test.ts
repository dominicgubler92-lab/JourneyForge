import { describe, expect, it } from "vitest";
import { demoTravelProvider } from "@/lib/travel/providers/demo";

describe("demoTravelProvider", () => {
  const input = {
    origin: "Zurich",
    destination: "Lisbon",
    startDate: "2026-07-10",
    endDate: "2026-07-17",
    travelers: 2,
    budget: 2400,
    vibe: "balanced" as const,
  };

  it("returns normalized flight options with booking links", async () => {
    const flights = await demoTravelProvider.searchFlights(input);

    expect(flights.length).toBeGreaterThan(0);
    expect(flights[0].bookingLink.url).toContain("google.com/travel/flights");
  });

  it("returns normalized stay options with calculated nights", async () => {
    const stays = await demoTravelProvider.searchStays(input);

    expect(stays.length).toBeGreaterThan(0);
    expect(stays[0].nights).toBe(7);
  });
});

