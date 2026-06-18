export const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";
export const EMAIL_FOR_SIGN_IN_SESSION_KEY = "emailForSignInSession";

export function getMagicLinkCallbackUrl(): string {
  return `${getAppOrigin()}/auth/callback`;
}

export function getAppOrigin(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function storeEmailForSignIn(email: string) {
  window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
  window.sessionStorage.setItem(EMAIL_FOR_SIGN_IN_SESSION_KEY, email);
}

export function readStoredEmailForSignIn(): string | null {
  return (
    window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY) ??
    window.sessionStorage.getItem(EMAIL_FOR_SIGN_IN_SESSION_KEY)
  );
}

export function clearStoredEmailForSignIn() {
  window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  window.sessionStorage.removeItem(EMAIL_FOR_SIGN_IN_SESSION_KEY);
}

export function getOobCodeFromUrl(url: string): string | null {
  try {
    return new URL(url).searchParams.get("oobCode");
  } catch {
    return null;
  }
}

function magicLinkSessionKey(oobCode: string) {
  return `magicLink:${oobCode}`;
}

export function getMagicLinkSessionState(
  oobCode: string,
): "idle" | "processing" | "done" {
  const value = window.sessionStorage.getItem(magicLinkSessionKey(oobCode));
  if (value === "processing" || value === "done") return value;
  return "idle";
}

export function setMagicLinkSessionState(
  oobCode: string,
  state: "processing" | "done",
) {
  window.sessionStorage.setItem(magicLinkSessionKey(oobCode), state);
}

export function clearMagicLinkSessionState(oobCode: string) {
  window.sessionStorage.removeItem(magicLinkSessionKey(oobCode));
}
