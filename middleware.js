import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const base64 = authHeader.split(' ')[1];
    const [user, password] = Buffer.from(base64, 'base64').toString().split(':');

    const validUser = process.env.ADMIN_USER;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (user === validUser && password === validPassword) {
      return NextResponse.next();
    }
  }

  // Return 401 to trigger browser Basic Auth dialog
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
