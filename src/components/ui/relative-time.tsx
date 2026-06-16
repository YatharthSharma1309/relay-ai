"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/utils";

type RelativeTimeProps = {
  date: Date | string;
  className?: string;
};

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const iso = new Date(date).toISOString();
  const [label, setLabel] = useState(() => formatRelativeTime(date));

  useEffect(() => {
    queueMicrotask(() => setLabel(formatRelativeTime(date)));
    const timer = window.setInterval(
      () => setLabel(formatRelativeTime(date)),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, [date]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
