type AmadeusToken = {
  access_token: string;
  expires_in: number;
};

export async function getAmadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    next: { revalidate: 60 * 20 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AmadeusToken;
}

export async function amadeusFetch(path: string, token: string, init?: RequestInit) {
  return fetch(`https://test.api.amadeus.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}
