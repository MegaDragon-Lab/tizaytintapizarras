'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [arts, setArts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waNumber, setWaNumber] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState({ msg: '', type: 'ok', visible: false });
  const [hover, setHover] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const fileInputRef = useRef();
  const dropRef = useRef();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin-login', { method: 'DELETE' });
    router.push('/admin/login');
  }

  useEffect(() => {
    fetchArts();
    const saved = localStorage.getItem('ttWa') || '';
    setWaNumber(saved);
    const onMove = e => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  async function fetchArts() {
    setLoading(true);
    try {
      const res = await fetch('/api/arts');
      setArts(await res.json());
    } catch { setArts([]); }
    setLoading(false);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  function handleFile(f) {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { showToast('Imagen muy grande — máx 10 MB', 'error'); return; }
    setFile(f);
    setPreviewName(f.name);
    const r = new FileReader();
    r.onload = e => setPreviewSrc(e.target.result);
    r.readAsDataURL(f);
  }

  function clearFile(e) {
    e.stopPropagation();
    setFile(null); setPreviewSrc(null); setPreviewName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    dropRef.current?.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  }

  async function publishArt() {
    if (!waNumber.trim()) { showToast('Ingresa tu número de WhatsApp', 'error'); return; }
    if (!title.trim())    { showToast('Escribe el título de la obra', 'error'); return; }
    if (!file)            { showToast('Selecciona una fotografía', 'error'); return; }

    setPublishing(true);
    setProgress(20);
    localStorage.setItem('ttWa', waNumber.trim());

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('desc', desc.trim());
      fd.append('wa', waNumber.replace(/\s+/g, ''));

      setProgress(50);
      const res = await fetch('/api/arts', { method: 'POST', body: fd });
      setProgress(90);

      if (!res.ok) throw new Error(await res.text());

      const newArt = await res.json();
      setArts(prev => [newArt, ...prev]);
      setTitle(''); setDesc(''); setFile(null); setPreviewSrc(null); setPreviewName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setProgress(100);
      setTimeout(() => setProgress(0), 600);
      showToast('Obra publicada');
    } catch (err) {
      console.error(err);
      showToast('Error al publicar. Intenta de nuevo.', 'error');
      setProgress(0);
    }
    setPublishing(false);
  }

  async function deleteArt(art) {
    if (!confirm(`¿Eliminar "${art.title}" de la galería?`)) return;
    try {
      const res = await fetch(`/api/arts/${art.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setArts(prev => prev.filter(a => a.id !== art.id));
      showToast('Obra eliminada');
    } catch {
      showToast('Error al eliminar. Intenta de nuevo.', 'error');
    }
  }

  const h = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };

  return (
    <>
      <div id="cursor" className={hover ? 'hover' : ''} style={{ left: cursorPos.x, top: cursorPos.y }} />

      <header className="top-bar">
        <span className="nav-brand">Tiza &amp; Tinta — Pizarras</span>
        <span className="nav-tagline">Panel del artista</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="nav-action" href="/" {...h}>← Ver galería</Link>
          <button className="nav-action" onClick={logout} {...h}>Salir</button>
        </div>
      </header>

      <main className="admin-page">
        <div className="admin-header">
          <h1 className="admin-title">Publicar obra</h1>
          <p className="admin-sub">Panel del artista · Acceso restringido</p>
        </div>

        <div className="form-section">
          <div className="field">
            <label className="field-label" htmlFor="wa">Número WhatsApp</label>
            <input type="tel" className="field-input" id="wa" placeholder="+1 809 555 1234"
              value={waNumber} onChange={e => setWaNumber(e.target.value)} {...h} />
            <span className="field-hint">Con código de país · Se guarda en este navegador</span>
          </div>

          <div className="form-divider" />

          <div className="field">
            <label className="field-label" htmlFor="title">Título de la obra</label>
            <input type="text" className="field-input" id="title" placeholder="Nombre de la pieza..."
              value={title} onChange={e => setTitle(e.target.value)} {...h} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desc">
              Descripción <span style={{ opacity: .5 }}>(opcional)</span>
            </label>
            <input type="text" className="field-input" id="desc" placeholder="Dimensiones, técnica, materiales..."
              value={desc} onChange={e => setDesc(e.target.value)} {...h} />
          </div>

          <div className="field">
            <label className="field-label">Fotografía</label>
            <div ref={dropRef} className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add('drag-over'); }}
              onDragLeave={() => dropRef.current?.classList.remove('drag-over')}
              onDrop={handleDrop} {...h}>
              <div className="drop-icon-wrap">📷</div>
              <p className="drop-text">Arrastra o pulsa para seleccionar</p>
              <p className="drop-sub">JPG · PNG · WEBP · Máx 10 MB</p>
            </div>
            {previewSrc && (
              <div className="preview-strip visible">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="preview-thumb" src={previewSrc} alt="" />
                <span className="preview-name">{previewName}</span>
                <button className="preview-clear" onClick={clearFile} {...h}>✕</button>
              </div>
            )}
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          <div className={`upload-progress${progress > 0 ? ' visible' : ''}`}>
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="form-divider" />

          <button className="btn-publish" onClick={publishArt} disabled={publishing} {...h}>
            {publishing ? `Subiendo... ${progress}%` : 'Publicar en galería'}
          </button>
        </div>

        {/* MANAGE */}
        <div className="manage-section">
          <p className="manage-title">
            Gestionar obras publicadas ({loading ? '…' : arts.length})
          </p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 74 }} />)}
            </div>
          ) : arts.length === 0 ? (
            <p className="manage-empty">No hay obras publicadas todavía.</p>
          ) : (
            <div className="manage-list">
              {arts.map((art, i) => (
                <div className="manage-item" key={art.id} {...h}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="manage-thumb" src={art.imgUrl} alt={art.title} />
                  <div className="manage-info">
                    <p className="manage-name">{art.title}</p>
                    <p className="manage-meta">
                      #{String(i + 1).padStart(2, '0')}
                      {art.desc ? ` · ${art.desc}` : ''}
                      {art.createdAt ? ` · ${new Date(art.createdAt).toLocaleDateString('es')}` : ''}
                    </p>
                  </div>
                  <button className="btn-delete" onClick={() => deleteArt(art)} {...h}>
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer>
        <span className="footer-brand">Tiza &amp; Tinta — Pizarras</span>
        <span className="footer-copy">Panel del artista</span>
      </footer>

      <div className={`toast${toast.visible ? ' show' : ''}${toast.type === 'error' ? ' error' : ''}`}>
        {toast.msg}
      </div>
    </>
  );
}
