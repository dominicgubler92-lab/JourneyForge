import { NextResponse } from "next/server";
import {
  getAmadeusEnvironment,
  hasAmadeusCredentials,
} from "@/lib/travel/providers/amadeus-client";
import {
  getSkyscannerEnvironment,
  hasSkyscannerCredentials,
} from "@/lib/travel/providers/skyscanner-client";

export async function GET() {
  const skyscannerConfigured = hasSkyscannerCredentials();
  const amadeusConfigured = hasAmadeusCredentials();
  const liveReady = skyscannerConfigured || amadeusConfigured;

  return NextResponse.json({
    providers: [
      {
        id: "skyscanner",
        label: "Skyscanner",
        configured: skyscannerConfigured,
        environment: getSkyscannerEnvironment(),
        capabilities: ["autosuggest", "flights-live-prices", "flights-indicative-prices"],
        modeHint: skyscannerConfigured ? "live-ready" : "needs-approval",
      },
      {
        id: "amadeus",
        label: "Amadeus",
        configured: amadeusConfigured,
        environment: getAmadeusEnvironment(),
        capabilities: ["airport-search", "flight-inspiration"],
        modeHint: amadeusConfigured ? "legacy-ready" : "legacy-disabled",
      },
    ],
    activeProvider: skyscannerConfigured ? "skyscanner" : amadeusConfigured ? "amadeus" : "demo",
    activeModeHint: liveReady ? "live-ready" : "demo-fallback",
  });
}
