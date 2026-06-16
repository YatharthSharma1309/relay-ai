export function isDemoSeedAllowed(request: Request) {
  const secret = process.env.DEMO_SEED_SECRET;

  if (process.env.NODE_ENV === "production" && !secret) {
    return false;
  }

  if (secret && request.headers.get("x-demo-seed-secret") === secret) {
    return true;
  }

  if (process.env.NODE_ENV === "development" && !secret) {
    return true;
  }

  return false;
}
