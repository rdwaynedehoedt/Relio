export const LANDING_NAV_OFFSET = 80;

export function scrollToLandingSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if (!element) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const targetTop =
    element.getBoundingClientRect().top +
    window.scrollY -
    LANDING_NAV_OFFSET;

  window.scrollTo({
    top: targetTop,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

export type LandingSectionId = "features" | "integrations";

export const LANDING_SECTION_IDS: LandingSectionId[] = [
  "features",
  "integrations",
];
