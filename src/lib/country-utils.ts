export type DetectedCountry = {
  country: string;
  countryCode: string;
};

const countryFlags: Record<string, string> = {
  "United States": "🇺🇸",
  USA: "🇺🇸",
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  Canada: "🇨🇦",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Netherlands: "🇳🇱",
  Australia: "🇦🇺",
  India: "🇮🇳",
  Japan: "🇯🇵",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Brazil: "🇧🇷",
  Mexico: "🇲🇽",
  Sweden: "🇸🇪",
  Norway: "🇳🇴",
  Denmark: "🇩🇰",
  Switzerland: "🇨🇭",
  Belgium: "🇧🇪",
  Ireland: "🇮🇪",
  Singapore: "🇸🇬",
  "South Korea": "🇰🇷",
  Portugal: "🇵🇹",
  Poland: "🇵🇱",
};

export function countryCodeToFlag(countryCode?: string) {
  if (!countryCode || countryCode.length !== 2) return "🌍";

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}

export function getCountryFlag(country?: string, countryCode?: string) {
  if (countryCode) return countryCodeToFlag(countryCode);
  if (!country) return "🌍";
  return countryFlags[country] ?? "🌍";
}

export function getCountryDisplay(country?: string, countryCode?: string) {
  if (!country) return null;
  const flag = getCountryFlag(country, countryCode);
  return `${flag} ${country}`;
}

export async function fetchDetectedCountry(): Promise<DetectedCountry | null> {
  try {
    const response = await fetch("/api/geo");
    if (!response.ok) return null;

    const data = (await response.json()) as {
      country?: string | null;
      countryCode?: string | null;
    };

    if (!data.country || !data.countryCode) return null;

    return {
      country: data.country,
      countryCode: data.countryCode,
    };
  } catch {
    return null;
  }
}
