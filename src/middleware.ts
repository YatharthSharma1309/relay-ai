import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/help(.*)",
  "/widget/embed(.*)",
  "/api/widget(.*)",
  "/api/webhooks/clerk",
  "/api/health",
]);

function isAuthBypass() {
  if (
    process.env.CI === "true" &&
    process.env.E2E_AUTH_BYPASS === "true" &&
    (process.env.AUTH_BYPASS === "true" ||
      process.env.NEXT_PUBLIC_AUTH_BYPASS === "true")
  ) {
    return true;
  }

  return (
    process.env.NODE_ENV !== "production" &&
    (process.env.AUTH_BYPASS === "true" ||
      process.env.NEXT_PUBLIC_AUTH_BYPASS === "true")
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (isAuthBypass()) {
    const path = request.nextUrl.pathname;
    if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return;
  }

  if (request.nextUrl.pathname.startsWith("/api/demo/seed")) {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
