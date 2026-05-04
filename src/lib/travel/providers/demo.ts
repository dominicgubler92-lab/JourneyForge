import type { TravelProvider } from "@/lib/travel/types";
import type { TripSearchInput } from "@/lib/travel/schemas";

const currencies = ["CHF", "EUR", "USD"] as const;

function currencyFor(input: TripSearchInput) {
  return input.origin.toLowerCase().includes("zurich") ||
    input.origin.toLowerCase().includes("zürich")
    ? currencies[0]
    : currencies[1];
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function bookingUrl(kind: "flight" | "stay", input: TripSearchInput, id: string) {
  const params = new URLSearchParams({
    origin: input.origin,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    travelers: String(input.travelers),
    kids: String(input.kids),
    jf_option: id,
  });

  return `https://www.google.com/travel/${kind === "flight" ? "flights" : "hotels"}?${params.toString()}`;
}

export const demoTravelProvider: TravelProvider = {
  name: "JourneyForge Demo Provider",

  async searchFlights(input) {
    const currency = currencyFor(input);
    const base = 240;
    const passengerFactor = input.travelers + input.kids * 0.7;

    return [
      {
        id: "flight-direct-smart",
        provider: "Amadeus-ready demo",
        airline: "Swiss / partner mix",
        route: `${input.origin} -> ${input.destination}`,
        departureTime: "08:35",
        arrivalTime: "11:10",
        duration: "2h 35m",
        stops: 0,
        price: { amount: Math.round(base + passengerFactor * 55), currency },
        score: 94,
        bookingLink: {
          label: "Open flight booking",
          provider: "Google Travel",
          url: bookingUrl("flight", input, "flight-direct-smart"),
        },
      },
      {
        id: "flight-value-connection",
        provider: "Amadeus-ready demo",
        airline: "Star Alliance mix",
        route: `${input.origin} -> ${input.destination}`,
        departureTime: "12:20",
        arrivalTime: "16:45",
        duration: "4h 25m",
        stops: 1,
        price: { amount: Math.round(base - 45 + passengerFactor * 44), currency },
        score: 87,
        bookingLink: {
          label: "Open flight booking",
          provider: "Google Travel",
          url: bookingUrl("flight", input, "flight-value-connection"),
        },
      },
      {
        id: "flight-evening-flex",
        provider: "Amadeus-ready demo",
        airline: "Lufthansa Group",
        route: `${input.origin} -> ${input.destination}`,
        departureTime: "18:05",
        arrivalTime: "22:15",
        duration: "4h 10m",
        stops: 1,
        price: { amount: Math.round(base + 30 + passengerFactor * 50), currency },
        score: 82,
        bookingLink: {
          label: "Open flight booking",
          provider: "Google Travel",
          url: bookingUrl("flight", input, "flight-evening-flex"),
        },
      },
    ];
  },

  async searchStays(input) {
    const nights = daysBetween(input.startDate, input.endDate);
    const currency = currencyFor(input);
    const nightlyBase = input.kids > 0 ? 168 : 150;

    return [
      {
        id: "stay-central-boutique",
        provider: "Hotel-ready demo",
        name: `${input.destination} Central House`,
        area: "Central district",
        nights,
        rating: 4.7,
        amenities: ["Breakfast", "Walkable", "Flexible cancellation"],
        price: { amount: nightlyBase * nights, currency },
        score: 92,
        bookingLink: {
          label: "Open hotel booking",
          provider: "Google Hotels",
          url: bookingUrl("stay", input, "stay-central-boutique"),
        },
      },
      {
        id: "stay-design-loft",
        provider: "Hotel-ready demo",
        name: `${input.destination} Design Loft`,
        area: "Creative quarter",
        nights,
        rating: 4.8,
        amenities: ["Kitchenette", "Workspace", "Near transit"],
        price: { amount: Math.round((nightlyBase + 38) * nights), currency },
        score: 89,
        bookingLink: {
          label: "Open stay booking",
          provider: "Google Hotels",
          url: bookingUrl("stay", input, "stay-design-loft"),
        },
      },
      {
        id: "stay-quiet-suite",
        provider: "Hotel-ready demo",
        name: `${input.destination} Quiet Suites`,
        area: "Residential edge",
        nights,
        rating: 4.5,
        amenities: ["Quiet rooms", "Late check-in", "Family friendly"],
        price: { amount: Math.round((nightlyBase - 24) * nights), currency },
        score: 84,
        bookingLink: {
          label: "Open stay booking",
          provider: "Google Hotels",
          url: bookingUrl("stay", input, "stay-quiet-suite"),
        },
      },
    ];
  },
};
