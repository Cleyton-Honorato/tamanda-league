import { NextResponse, type NextRequest } from 'next/server';
import { COOKIES, ROUTES } from '@/lib/constants';
import { verifySessionToken } from '@/server/auth/jwt';

/**
 * Guard de navegação do painel — otimista, só para não pintar uma tela que
 * seria negada. A autoridade é `requireAdmin()`, chamada no layout do admin e
 * dentro de cada action.
 *
 * O site é público: o matcher cobre apenas `/admin`.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === ROUTES.adminLogin;

  const token = request.cookies.get(COOKIES.SESSION)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.adminLogin;
    url.search = '';
    url.searchParams.set('returnTo', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.admin;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
