import { NextResponse } from 'next/server';

export function middleware(request) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Basic ')) {
    const base64 = authHeader.split(' ')[1];
    // Edge Runtime no tiene Buffer — usar atob() que sí está disponible
    const decoded = atob(base64);
    const colon = decoded.indexOf(':');
    const user = decoded.substring(0, colon);
    const password = decoded.substring(colon + 1);

    if (user === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Acceso no autorizado', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Tiza & Tinta — Panel del Artista"',
    },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
