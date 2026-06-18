import { NextResponse } from "next/server";

type RateKey = "USD" | "GBP" | "AED" | "AUD";

async function fetchLkrCrossRates(): Promise<Record<RateKey, number>> {
  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exchange rates.");
  }

  const data = (await response.json()) as {
    rates: Record<string, number>;
  };

  const lkrPerUsd = data.rates.LKR;
  if (!lkrPerUsd) {
    throw new Error("LKR rate unavailable.");
  }

  const toLkr = (currency: RateKey) => {
    if (currency === "USD") return lkrPerUsd;
    const perUsd = data.rates[currency];
    if (!perUsd) {
      throw new Error(`${currency} rate unavailable.`);
    }
    return lkrPerUsd / perUsd;
  };

  return {
    USD: toLkr("USD"),
    GBP: toLkr("GBP"),
    AED: toLkr("AED"),
    AUD: toLkr("AUD"),
  };
}

export async function GET() {
  try {
    const rates = await fetchLkrCrossRates();
    return NextResponse.json({ rates });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch exchange rates.",
      },
      { status: 500 },
    );
  }
}
