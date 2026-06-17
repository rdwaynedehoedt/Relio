export function extractDomain(websiteOrDomain: string): string {
  const value = websiteOrDomain.trim();
  if (!value) return "";

  try {
    if (value.includes("://")) {
      return new URL(value).hostname.replace(/^www\./i, "");
    }
  } catch {
    // Fall through to plain domain parsing.
  }

  return value.replace(/^www\./i, "").split("/")[0].split("?")[0];
}

export async function fetchCompanyLogo(domain: string): Promise<string> {
  const normalized = extractDomain(domain);
  if (!normalized) return "";

  const logoUrl = `https://companyenrich.com/api/logo?domain=${encodeURIComponent(normalized)}`;

  try {
    const response = await fetch(logoUrl, { method: "GET", cache: "no-store" });
    if (response.ok) return logoUrl;
  } catch {
    // Ignore logo fetch failures.
  }

  return "";
}
