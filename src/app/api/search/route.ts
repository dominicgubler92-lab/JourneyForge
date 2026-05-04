import { NextResponse } from "next/server";
import { tripSearchSchema } from "@/lib/travel/schemas";
import { searchTravel } from "@/lib/travel/providers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = tripSearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid trip search.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await searchTravel(parsed.data);
  return NextResponse.json(result);
}

