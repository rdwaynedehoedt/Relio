import { RELIO_LOGO_PATH } from "@/lib/relio-logo-svg";
import { cn } from "@/lib/utils";

type RelioLogoProps = {
  className?: string;
  variant?: "tile" | "mark";
};

export default function RelioLogo({
  className,
  variant = "tile",
}: RelioLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Relio"
      className={cn("shrink-0", className)}
    >
      {variant === "tile" ? (
        <>
          <rect width="32" height="32" rx="9" className="fill-primary" />
          <path
            d={RELIO_LOGO_PATH}
            className="fill-primary-foreground"
          />
        </>
      ) : (
        <path d={RELIO_LOGO_PATH} className="fill-primary" />
      )}
    </svg>
  );
}
