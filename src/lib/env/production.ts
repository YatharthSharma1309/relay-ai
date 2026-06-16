export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.CI === "true" && process.env.AUTH_BYPASS === "true") return;

  const missing: string[] = [];

  if (!process.env.DATABASE_URL?.trim()) missing.push("DATABASE_URL");
  if (!process.env.CLERK_SECRET_KEY?.trim()) missing.push("CLERK_SECRET_KEY");
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }
  if (!process.env.APP_URL?.trim()) missing.push("APP_URL");

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }

  if (
    process.env.AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_AUTH_BYPASS === "true"
  ) {
    throw new Error("AUTH_BYPASS cannot be enabled in production.");
  }

  if (!process.env.WIDGET_VISITOR_SECRET?.trim()) {
    console.warn(
      "[SupportAI] WIDGET_VISITOR_SECRET is not set — widget visitor tokens use a fallback secret.",
    );
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    !process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  ) {
    console.warn(
      "[SupportAI] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limits are per-instance only.",
    );
  }
}
