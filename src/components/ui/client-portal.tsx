"use client";

import { createPortal } from "react-dom";
import { useClientMounted } from "@/lib/use-client-mounted";

type ClientPortalProps = {
  children: React.ReactNode;
};

export function ClientPortal({ children }: ClientPortalProps) {
  const mounted = useClientMounted();

  if (!mounted) return null;

  return createPortal(children, document.body);
}
