import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_ASPECT = 1255.82 / 355.99;

type HubSpotLogoProps = {
  className?: string;
  height?: number;
};

export default function HubSpotLogo({
  className,
  height = 28,
}: HubSpotLogoProps) {
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <Image
      src="/integrations/hubspot-logo.svg"
      alt="HubSpot"
      width={width}
      height={height}
      unoptimized
      className={cn("h-auto w-auto max-w-full object-contain object-left", className)}
      style={{ height, width }}
      priority
    />
  );
}
