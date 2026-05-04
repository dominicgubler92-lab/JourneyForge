import { describe, expect, it } from "vitest";
import { tripSearchSchema } from "@/lib/travel/schemas";

describe("tripSearchSchema", () => {
  it("accepts a valid trip search", () => {
    const result = tripSearchSchema.safeParse({
      origin: "Zurich",
      destination: "Lisbon",
      startDate: "2026-07-10",
      endDate: "2026-07-17",
      travelers: 2,
      kids: 1,
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
      kids: 0,
    });

    expect(result.success).toBe(false);
  });
});
