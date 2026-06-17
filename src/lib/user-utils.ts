export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function capitalizeWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function nameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim() ?? "";
  if (!localPart) return "there";

  const segment = localPart.split(/[._-]/)[0] ?? localPart;
  return capitalizeWord(segment);
}

export function getUserFirstName(
  displayName?: string | null,
  email?: string | null,
): string {
  const trimmedName = displayName?.trim();
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0] ?? "there";
  }

  if (email?.trim()) {
    return nameFromEmail(email);
  }

  return "there";
}
