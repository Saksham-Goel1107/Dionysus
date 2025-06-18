import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api/stripe/webhook(.*)", "/", "/sync-user(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
    
    const { userId } = await auth();
    
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
