"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  name: string;
  logoUrl?: string;
  size?: number;
  className?: string;
  rounded?: "md" | "lg" | "xl";
};

export default function CompanyLogo({
  name,
  logoUrl,
  size = 32,
  className,
  rounded = "md",
}: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

  const roundedClass =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={cn(
          "shrink-0 border border-border bg-card object-contain",
          roundedClass,
          className,
        )}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-muted font-semibold text-muted-foreground",
        roundedClass,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}
    >
      {initials.length >= 2 ? initials : <Building2 className="size-4 text-muted-foreground" />}
    </div>
  );
}
