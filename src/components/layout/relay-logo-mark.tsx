"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type RelayLogoMarkProps = {
  className?: string;
  size?: number;
};

/** Relay AI brand mark — linked nodes on indigo→cyan gradient. */
export function RelayLogoMark({ className, size = 32 }: RelayLogoMarkProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <circle cx="9.5" cy="16" r="2.75" fill="white" fillOpacity="0.95" />
      <circle cx="22.5" cy="16" r="2.75" fill="white" fillOpacity="0.95" />
      <path
        d="M12.25 16c0-3 2.25-5.5 5.25-5.5s5.25 2.5 5.25 5.5-2.25 5.5-5.25 5.5"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19.75 13.25l2.5 2.75-2.5 2.75"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
