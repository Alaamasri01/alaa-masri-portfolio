import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { refreshSession } from "@/lib/supabase/proxy";

/** Pages reachable without signing in (path after the locale prefix). */
const PUBLIC_PAGES = new Set(["/sign-in", "/styleguide"]);

function preferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().slice(0, 2).toLowerCase();
    if (isLocale(tag)) return tag;
  }
  return defaultLocale;
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first = ""] = pathname.split("/");

  // 1. Every page lives under /ar or /en.
  if (!isLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // 2. Keep the Supabase session fresh.
  const { response, userId } = await refreshSession(request);
  response.headers.set("Cache-Control", "private, no-store");

  if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
    response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  // 3. Optimistic routing. Real authorization happens in the database (RLS).
  const rest = pathname.slice(first.length + 1) || "/";
  if (!userId && rest !== "/" && !PUBLIC_PAGES.has(rest)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/sign-in`;
    url.search = "";
    return redirectWithCookies(url, response);
  }
  if (userId && rest === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}`;
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals, auth route handlers and static files.
    "/((?!_next/|auth/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
