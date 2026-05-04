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
    kids: z.coerce.number().int().min(0).max(6).default(0),
    budget: z.coerce.number().int().min(200).max(50000).optional(),
  })
  .refine((value) => value.endDate > value.startDate, {
    message: "End date must be after the start date.",
    path: ["endDate"],
  });

export const selectedTripSchema = z.object({
  search: tripSearchSchema,
  selectedFlightId: z.string().min(1),
  selectedStayId: z.string().min(1),
});

export type TripSearchInput = z.infer<typeof tripSearchSchema>;
export type SelectedTripInput = z.infer<typeof selectedTripSchema>;
