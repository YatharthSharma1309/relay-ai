/** Portfolio/recruiter demo deploy without Clerk — not for real multi-tenant production. */
export function isPublicDemoMode() {
  return (
    process.env.PUBLIC_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_PUBLIC_DEMO_MODE === "true"
  );
}
