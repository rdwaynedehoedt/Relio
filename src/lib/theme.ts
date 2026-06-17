import type { ThemeMode } from "@/lib/types";
import { buildRelioLogoSvg } from "@/lib/relio-logo-svg";

export const THEME_STORAGE_KEY = "relio-theme";

function updateFavicon(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;

  const href = `data:image/svg+xml,${encodeURIComponent(buildRelioLogoSvg(resolved))}`;
  const rels = ["icon", "shortcut icon", "apple-touch-icon"];

  for (const rel of rels) {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }

    link.type = "image/svg+xml";
    link.href = href;
  }
}

export function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  updateFavicon(resolved);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore storage errors.
  }

  return "system";
}

export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";var p="M10.5 8.5h6.4c3.4 0 5.8 1.9 5.8 5.1 0 2.2-1.2 3.8-3.1 4.6l3.6 7.3h-3.8l-3.2-6.5h-2.7v6.5h-3V8.5zm3 3.2v4.3h2.9c1.7 0 2.7-.9 2.7-2.2 0-1.4-1-2.1-2.7-2.1h-2.9z";var tile=d?"#FAFAFA":"#171717";var mark=d?"#171717":"#FAFAFA";var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="'+tile+'"/><path fill="'+mark+'" d="'+p+'"/></svg>';var href="data:image/svg+xml,"+encodeURIComponent(svg);["icon","shortcut icon","apple-touch-icon"].forEach(function(r){var l=document.querySelector('link[rel="'+r+'"]');if(!l){l=document.createElement("link");l.rel=r;document.head.appendChild(l);}l.type="image/svg+xml";l.href=href;});}catch(e){}})();`;
