import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Checagem otimista (só cookie). A validação real ocorre em requireUser().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/inicio/:path*", "/glicemia/:path*", "/refeicoes/:path*", "/medicamentos/:path*", "/insulina/:path*", "/compartilhar/:path*", "/familia/:path*", "/relatorios/:path*", "/admin/:path*", "/mais/:path*", "/metas/:path*", "/perfil/:path*"] };
