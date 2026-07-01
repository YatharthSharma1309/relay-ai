import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { isPublicDemoMode } from "@/lib/env/public-demo";
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

function hasAuthBypassEnv() {
  return (
    process.env.AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_AUTH_BYPASS === "true"
  );
}

function isAuthBypass() {
  if (isPublicDemoMode() && hasAuthBypassEnv()) return true;

  if (process.env.E2E_AUTH_BYPASS === "true" && hasAuthBypassEnv()) {
    return true;
  }

  return process.env.NODE_ENV !== "production" && hasAuthBypassEnv();
}

function authBypassMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

const clerkProtectedMiddleware = clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith("/api/demo/seed")) {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isAuthBypass()) {
    return authBypassMiddleware(request);
  }
  return clerkProtectedMiddleware(request, event);
}
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
