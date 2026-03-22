import { cookies } from 'next/headers';

export async function POST(request) {
  const { user, password } = await request.json();

  if (
    user === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const cookieStore = cookies();
    cookieStore.set('admin_session', process.env.ADMIN_SECRET, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('admin_session');
  return Response.json({ ok: true });
}
