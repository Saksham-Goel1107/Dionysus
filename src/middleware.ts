import arcjet, { shield, tokenBucket, detectBot } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { geolocation } from '@vercel/functions';

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/docs(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/block(.*)",
]);

const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/sync-user(.*)",
]);

const notAllowedCountries = ['PK'];

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Protect against common attacks with Arcjet Shield
    shield({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
    }),
    // Block abusive bots
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        // "CATEGORY:MONITOR",
        "CATEGORY:PREVIEW",
      ],
    }),
    // Rate limit all requests (5 per 10 seconds per IP)
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: 10,
      capacity: 10,
    }),
  ],
});

export default clerkMiddleware(async (auth, request) => {
  const { country } = geolocation(request);
  const pathname = request.nextUrl.pathname;
  const isBlockPage = pathname.startsWith("/block");
  const decision = await aj.protect(request);

   if (decision.isDenied()) {
    return NextResponse.json({ error: "Forbidden", reason: decision.reason }, { status: 403 });
  }

  if (country && notAllowedCountries.includes(country)) {
    if (!isBlockPage) {
      return NextResponse.redirect(new URL("/block", request.url));
    }
    return NextResponse.next();
  }

  if (country && !notAllowedCountries.includes(country) && isBlockPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
    const { userId, sessionClaims } = await auth();

    if (
      userId &&
      !sessionClaims?.metadata?.onboardingComplete &&
      !isOnboardingRoute(request)
    ) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      return NextResponse.redirect(new URL("/onboarding", baseUrl));
    }

    if (userId && !pathname.startsWith("/sync-user")) {
      const referer = request.headers.get("referer") || "";
      if (referer.includes("/sign-in") || referer.includes("/sign-up")) {
        return NextResponse.redirect(new URL("/sync-user", request.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
