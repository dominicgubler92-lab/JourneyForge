import { NextResponse } from "next/server";
import {
  getAmadeusEnvironment,
  hasAmadeusCredentials,
} from "@/lib/travel/providers/amadeus-client";

export async function GET() {
  const configured = hasAmadeusCredentials();

  return NextResponse.json({
    providers: [
      {
        id: "amadeus",
        label: "Amadeus",
        configured,
        environment: getAmadeusEnvironment(),
        capabilities: ["airport-search", "flight-inspiration"],
        modeHint: configured ? "live-ready" : "demo-fallback",
      },
    ],
    activeModeHint: configured ? "live-ready" : "demo-fallback",
  });
}
