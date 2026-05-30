import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Bỏ qua API routes và static/public assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/voice/") ||
    pathname.startsWith("/locales/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Lấy cookie 'lang' hiện tại
  const lang = request.cookies.get("lang")?.value;
  const localeFromCookie = lang === "en" ? "en" : "vi";

  // 1. Nếu URL đã có locale (/en/... hoặc /vi/...)
  if (
    pathname.startsWith("/en/") ||
    pathname.startsWith("/vi/") ||
    pathname === "/en" ||
    pathname === "/vi"
  ) {
    const localeInPath = pathname.split("/")[1];

    // Nếu locale trong URL khác với Cookie, cập nhật lại Cookie
    if (localeInPath !== lang) {
      const response = NextResponse.next();
      response.cookies.set("lang", localeInPath, {
        maxAge: 365 * 24 * 60 * 60,
      });
      return response;
    }
    return NextResponse.next();
  }

  // 2. Nếu là root path "/", redirect theo cookie
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(`/${localeFromCookie}`, request.url)
    );
  }

  // 3. Với các path chưa có locale, thêm locale từ cookie vào đầu
  return NextResponse.redirect(
    new URL(`/${localeFromCookie}${pathname}`, request.url)
  );
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|locales).*)"],
};
