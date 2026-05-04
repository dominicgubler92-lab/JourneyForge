import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.");

export const tripSearchSchema = z
  .object({
    origin: z.string().trim().min(2, "Enter a departure city or airport."),
    destination: z.string().trim().min(2, "Enter a destination."),
    startDate: isoDate,
    endDate: isoDate,
    travelers: z.coerce.number().int().min(1).max(8),
    budget: z.coerce.number().int().min(200).max(50000).optional(),
  })
  .refine((value) => value.endDate > value.startDate, {
    message: "End date must be after the start date.",
    path: ["endDate"],
  });

export const airportSearchSchema = z.object({
  query: z.string().trim().min(2, "Enter at least two characters.").max(80),
});

export const airportOptionSchema = z.object({
  id: z.string().min(1),
  iataCode: z.string().trim().length(3).toUpperCase(),
  name: z.string().min(1),
  cityName: z.string().min(1),
  countryName: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.enum(["airport", "city"]),
});

export const dealSearchSchema = z.object({
  origin: airportOptionSchema,
  travelers: z.coerce.number().int().min(1).max(8),
  budget: z.coerce.number().int().min(200).max(50000),
  window: z.literal("next_3_months").default("next_3_months"),
  minNights: z.coerce.number().int().min(1).max(30).default(3),
  maxNights: z.coerce.number().int().min(1).max(30).default(7),
  region: z.literal("europe").default("europe"),
}).refine((value) => value.maxNights >= value.minNights, {
  message: "Maximum nights must be greater than or equal to minimum nights.",
  path: ["maxNights"],
});

export const selectedTripSchema = z.object({
  search: tripSearchSchema,
  selectedFlightId: z.string().min(1),
  selectedStayId: z.string().min(1),
});

export type TripSearchInput = z.infer<typeof tripSearchSchema>;
export type AirportSearchInput = z.infer<typeof airportSearchSchema>;
export type AirportOptionInput = z.infer<typeof airportOptionSchema>;
export type DealSearchInput = z.infer<typeof dealSearchSchema>;
export type SelectedTripInput = z.infer<typeof selectedTripSchema>;
