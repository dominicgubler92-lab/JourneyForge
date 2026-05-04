import { NextResponse } from "next/server";
import { dealSearchSchema } from "@/lib/travel/schemas";
import { searchDeals } from "@/lib/travel/providers/deals";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = dealSearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid deal search.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await searchDeals(parsed.data);
  return NextResponse.json(result);
}
