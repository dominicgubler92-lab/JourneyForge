export function getSkyscannerBaseUrl() {
  return process.env.SKYSCANNER_BASE_URL ?? "https://partners.api.skyscanner.net";
}

export function hasSkyscannerCredentials() {
  return Boolean(process.env.SKYSCANNER_API_KEY);
}

export function getSkyscannerEnvironment() {
  const baseUrl = getSkyscannerBaseUrl();

  if (baseUrl.includes("partners.api.skyscanner.net")) {
    return "production";
  }

  return "custom";
}

export async function skyscannerFetch(path: string, init?: RequestInit) {
  const apiKey = process.env.SKYSCANNER_API_KEY;

  if (!apiKey) {
    return null;
  }

  return fetch(`${getSkyscannerBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...init?.headers,
    },
  });
}
