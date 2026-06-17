import { NextResponse } from "next/server";

type GeoResponse = {
  country: string | null;
  countryCode: string | null;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "";

  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return null;
  }

  return ip;
}

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json<GeoResponse>(
        { country: null, countryCode: null },
        { status: 200 },
      );
    }

    const data = (await response.json()) as {
      country_name?: string;
      country_code?: string;
      error?: boolean;
    };

    if (data.error || !data.country_name || !data.country_code) {
      return NextResponse.json<GeoResponse>(
        { country: null, countryCode: null },
        { status: 200 },
      );
    }

    return NextResponse.json<GeoResponse>({
      country: data.country_name,
      countryCode: data.country_code,
    });
  } catch {
    return NextResponse.json<GeoResponse>(
      { country: null, countryCode: null },
      { status: 200 },
    );
  }
}
