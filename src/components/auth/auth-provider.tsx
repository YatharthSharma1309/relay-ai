import { ClerkProvider } from "@clerk/nextjs";
import { isAuthBypassEnabled } from "@/lib/auth/demo";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isAuthBypassEnabled()) {
    return <>{children}</>;
  }

  return <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>;
}
