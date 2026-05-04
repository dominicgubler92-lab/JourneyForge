import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { selectedTripSchema } from "@/lib/travel/schemas";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in before saving trips." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = selectedTripSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid trip selection.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      destination: parsed.data.search.destination,
      start_date: parsed.data.search.startDate,
      end_date: parsed.data.search.endDate,
      travelers: parsed.data.search.travelers,
      selected_flight_id: parsed.data.selectedFlightId,
      selected_stay_id: parsed.data.selectedStayId,
      payload: parsed.data,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
