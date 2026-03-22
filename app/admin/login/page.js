'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onMove = e => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    }

    setLoading(false);
  }

  const h = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  return (
    <>
      <div id="cursor" className={hover ? 'hover' : ''} style={{ left: cursorPos.x, top: cursorPos.y }} />

      <header className="top-bar">
        <span style={{display:"flex",alignItems:"center",gap:12}}><img src="/logo.jpg" alt="Logo" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:"1px solid rgba(250,250,249,.2)"}}/><span className="nav-brand">Tiza &amp; Tinta — Pizarras</span></span>
      </header>

      <main style={{
        minHeight: 'calc(100vh - 58px - 65px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--black)', paddingBottom: 24, marginBottom: 36 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '2rem',
              lineHeight: 1,
              marginBottom: 6,
            }}>Panel del artista</h1>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '.58rem',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--mid-gray)',
            }}>Acceso restringido</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="field">
              <label className="field-label" htmlFor="user">Usuario</label>
              <input
                className="field-input"
                id="user"
                type="text"
                autoComplete="username"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="Usuario"
                required
                {...h}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password">Contraseña</label>
              <input
                className="field-input"
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                {...h}
              />
            </div>

            {error && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '.6rem',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: '#c0392b',
                padding: '10px 12px',
                border: '1px solid #c0392b',
                background: '#fff5f5',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-publish"
              disabled={loading}
              style={{ marginTop: 4 }}
              {...h}
            >
              {loading ? 'Verificando...' : 'Entrar al panel'}
            </button>
          </form>

        </div>
      </main>

      <footer>
        <span className="footer-brand">Tiza &amp; Tinta — Pizarras</span>
        <span className="footer-copy">Arte Hecho a Mano</span>
      </footer>
    </>
  );
}
