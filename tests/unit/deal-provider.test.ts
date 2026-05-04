import { describe, expect, it } from "vitest";
import { searchDeals } from "@/lib/travel/providers/deals";

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

describe("searchDeals", () => {
  it("returns sorted deal results without hotel or kids fields", async () => {
    const result = await searchDeals({
      origin,
      travelers: 2,
      budget: 1600,
      window: "next_3_months",
      minNights: 3,
      maxNights: 7,
      region: "europe",
    });

    expect(result.deals.length).toBeGreaterThan(0);
    expect(result.deals[0].price.amount).toBeLessThanOrEqual(result.deals.at(-1)?.price.amount ?? 0);
    expect(result.deals[0]).not.toHaveProperty("stayOptions");
    expect(result.deals[0]).not.toHaveProperty("kids");
  });
});
