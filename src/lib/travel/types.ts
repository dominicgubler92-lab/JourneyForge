export type Money = {
  amount: number;
  currency: "CHF" | "EUR" | "USD";
};

export type BookingLink = {
  label: string;
  url: string;
  provider: string;
};

export type FlightOption = {
  id: string;
  provider: string;
  airline: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: Money;
  score: number;
  bookingLink: BookingLink;
};

export type StayOption = {
  id: string;
  provider: string;
  name: string;
  area: string;
  nights: number;
  rating: number;
  amenities: string[];
  price: Money;
  score: number;
  bookingLink: BookingLink;
};

export type ProviderMetadata = {
  mode: "live" | "demo";
  providers: string[];
  generatedAt: string;
  notes: string[];
};

export type TripSearchResult = {
  flightOptions: FlightOption[];
  stayOptions: StayOption[];
  providerMetadata: ProviderMetadata;
};

export type TravelProvider = {
  name: string;
  searchFlights(input: import("./schemas").TripSearchInput): Promise<FlightOption[]>;
  searchStays(input: import("./schemas").TripSearchInput): Promise<StayOption[]>;
};

