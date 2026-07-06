/** Client-safe: public portfolio / recruiter demo (no Clerk sign-in). */
export function isMarketingDemoMode() {
  return (
    process.env.NEXT_PUBLIC_AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_PUBLIC_DEMO_MODE === "true"
  );
}

export const demoModuleLinks = [
  { href: "/dashboard", label: "Command center" },
  { href: "/chat", label: "RAG chatbot" },
  { href: "/recruitment", label: "Recruitment" },
  { href: "/analytics", label: "Analytics" },
] as const;
