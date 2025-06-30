import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { geolocation } from '@vercel/functions'

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)",  "/", "/docs(.*)", "/privacy(.*)", "/terms(.*)", "/block(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)", "/sync-user(.*)"]);
const isBlockRoute = createRouteMatcher(['/block(.*)'])

const allowedCountries = ['US']

export default clerkMiddleware(async (auth, request) => {

  if (isBlockRoute(request)) {
    return
  }
  const { country } = geolocation(request)
  if (country && !allowedCountries.includes(country)) {
    return NextResponse.redirect(new URL('/block', request.url))
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
    const { userId, sessionClaims } = await auth();

    if (
      userId &&
      !sessionClaims?.metadata?.onboardingComplete &&
      !isOnboardingRoute(request)
    ) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const onboardingUrl = new URL("/onboarding", baseUrl);
      return NextResponse.redirect(onboardingUrl.toString());
    }

    if (userId && !request.nextUrl.pathname.startsWith('/sync-user')) {
      const referer = request.headers.get("referer") || "";
      
      if (referer.includes("/sign-in") || referer.includes("/sign-up")) {
        return NextResponse.redirect(new URL("/sync-user", request.url));
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
