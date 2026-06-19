"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type ChartContainerProps = {
  className?: string;
  height?: number;
  children: ReactElement;
};

export function ChartContainer({
  className,
  height = 256,
  children,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const { width, height: measuredHeight } = element.getBoundingClientRect();
      if (width > 0 && measuredHeight > 0) {
        setSize({ width, height: measuredHeight });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, [height]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full min-w-0", className)}
      style={{ height }}
    >
      {size ? (
        <ResponsiveContainer width={size.width} height={size.height} minWidth={0}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
