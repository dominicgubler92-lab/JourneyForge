import { NextResponse } from "next/server";
import { airportSearchSchema } from "@/lib/travel/schemas";
import { searchAirports } from "@/lib/travel/providers/airports";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = airportSearchSchema.safeParse({
    query: url.searchParams.get("query") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid airport search.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const airports = await searchAirports(parsed.data.query);
  return NextResponse.json({ airports });
}
