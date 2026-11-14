import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

// Checagem otimista: sem sessão válida, as páginas vão para /login.
// As rotas de API verificam a sessão por conta própria (não dependem do proxy).
export async function proxy(request: NextRequest) {
  const secret = process.env.SESSION_SECRET ?? "";
  const profileId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, secret);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!profileId && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (profileId && isLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    // tudo, menos API, arquivos do Next e arquivos públicos (avatares, ícones…)
    "/((?!api|_next/static|_next/image|avatars|favicon.ico|icon|apple-icon|manifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)",
  ],
};
