import { NextResponse } from "next/server";

type UrlPreview = {
  title: string;
  description: string;
  image: string;
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractMetaContent(html: string, property: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

function extractTitle(html: string): string {
  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch?.[1] ? decodeHtml(titleMatch[1]) : "";
}

function extractDescription(html: string): string {
  const ogDescription = extractMetaContent(html, "og:description");
  if (ogDescription) return ogDescription;

  return extractMetaContent(html, "description");
}

function extractImage(html: string, baseUrl: string): string {
  const ogImage = extractMetaContent(html, "og:image");
  if (!ogImage) return "";

  try {
    return new URL(ogImage, baseUrl).toString();
  } catch {
    return ogImage;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ title: "", description: "", image: "" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json({ title: "", description: "", image: "" });
      }
    } catch {
      return NextResponse.json({ title: "", description: "", image: "" });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RelioBot/1.0; +https://relio.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ title: "", description: "", image: "" });
    }

    const html = await response.text();
    const preview: UrlPreview = {
      title: extractTitle(html),
      description: extractDescription(html),
      image: extractImage(html, parsedUrl.toString()),
    };

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ title: "", description: "", image: "" });
  }
}
