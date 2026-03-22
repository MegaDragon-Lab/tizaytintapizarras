'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [arts, setArts] = useState([]);
  const [waNumber, setWaNumber] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const fileInputRef = useRef();
  const dropRef = useRef();

  useEffect(() => {
    try { setArts(JSON.parse(localStorage.getItem('ttArts') || '[]')); } catch {}
    const saved = localStorage.getItem('ttWa') || '';
    setWaNumber(saved);
    const onMove = e => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }

  function handleFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Imagen muy grande — máx 10 MB'); return; }
    setCurrentFile(file);
    setPreviewName(file.name);
    const r = new FileReader();
    r.onload = e => setPreviewSrc(e.target.result);
    r.readAsDataURL(file);
  }

  function clearFile(e) {
    e.stopPropagation();
    setCurrentFile(null);
    setPreviewSrc(null);
    setPreviewName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    dropRef.current?.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  }

  function publishArt() {
    if (!waNumber.trim()) { showToast('Ingresa tu número de WhatsApp'); return; }
    if (!title.trim()) { showToast('Escribe el título de la obra'); return; }
    if (!currentFile) { showToast('Selecciona una fotografía'); return; }
    setPublishing(true);
    localStorage.setItem('ttWa', waNumber.trim());
    const r = new FileReader();
    r.onload = e => {
      const newArts = [{ id: Date.now(), title: title.trim(), desc: desc.trim(), img: e.target.result, wa: waNumber.replace(/\s+/g, '') }, ...arts];
      try { localStorage.setItem('ttArts', JSON.stringify(newArts)); } catch {}
      setArts(newArts);
      setTitle(''); setDesc(''); setCurrentFile(null); setPreviewSrc(null); setPreviewName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPublishing(false);
      showToast('Obra publicada');
    };
    r.readAsDataURL(currentFile);
  }

  function deleteArt(id) {
    if (!confirm('¿Eliminar esta obra de la galería?')) return;
    const updated = arts.filter(a => a.id !== id);
    try { localStorage.setItem('ttArts', JSON.stringify(updated)); } catch {}
    setArts(updated);
    showToast('Obra eliminada');
  }

  const h = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };

  return (
    <>
      <div id="cursor" className={hover ? 'hover' : ''} style={{ left: cursorPos.x, top: cursorPos.y }} />

      <header className="top-bar">
        <span className="nav-brand">Tiza &amp; Tinta</span>
        <span className="nav-tagline">Panel del artista</span>
        <Link className="nav-action" href="/" {...h}>← Ver galería</Link>
      </header>

      <main className="admin-page">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Publicar obra</h1>
            <p className="admin-sub">Panel del artista · Acceso restringido</p>
          </div>
        </div>

        {/* FORM */}
        <div className="form-section">
          <div className="field">
            <label className="field-label" htmlFor="waNumber">Número WhatsApp</label>
            <input type="tel" className="field-input" id="waNumber" placeholder="+1 809 555 1234"
              value={waNumber} onChange={e => setWaNumber(e.target.value)} {...h} />
            <span className="field-hint">Con código de país · Se guarda en tu dispositivo</span>
          </div>

          <div className="form-divider" />

          <div className="field">
            <label className="field-label" htmlFor="artTitle">Título de la obra</label>
            <input type="text" className="field-input" id="artTitle" placeholder="Nombre de la pieza..."
              value={title} onChange={e => setTitle(e.target.value)} {...h} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="artDesc">
              Descripción <span style={{ opacity: .5 }}>(opcional)</span>
            </label>
            <input type="text" className="field-input" id="artDesc" placeholder="Dimensiones, técnica, materiales..."
              value={desc} onChange={e => setDesc(e.target.value)} {...h} />
          </div>

          <div className="field">
            <label className="field-label">Fotografía</label>
            <div
              ref={dropRef}
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add('drag-over'); }}
              onDragLeave={() => dropRef.current?.classList.remove('drag-over')}
              onDrop={handleDrop}
              {...h}
            >
              <div className="drop-icon-wrap">📷</div>
              <p className="drop-text">Arrastra o pulsa para seleccionar</p>
              <p className="drop-sub">JPG · PNG · WEBP · Máx 10 MB</p>
            </div>
            {previewSrc && (
              <div className="preview-strip visible">
                <img className="preview-thumb" src={previewSrc} alt="" />
                <span className="preview-name">{previewName}</span>
                <button className="preview-clear" onClick={clearFile} {...h}>✕</button>
              </div>
            )}
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          <div className="form-divider" />

          <button className="btn-publish" onClick={publishArt} disabled={publishing} {...h}>
            {publishing ? 'Publicando...' : 'Publicar en galería'}
          </button>
        </div>

        {/* MANAGE */}
        <div className="manage-section">
          <p className="manage-title">Gestionar obras publicadas ({arts.length})</p>
          {arts.length === 0 ? (
            <p className="manage-empty">No hay obras publicadas todavía.</p>
          ) : (
            <div className="manage-list">
              {arts.map((art, i) => (
                <div className="manage-item" key={art.id} {...h}>
                  <img className="manage-thumb" src={art.img} alt={art.title} />
                  <div className="manage-info">
                    <p className="manage-name">{art.title}</p>
                    <p className="manage-meta">#{String(i + 1).padStart(2, '0')} {art.desc ? `· ${art.desc}` : ''}</p>
                  </div>
                  <button className="btn-delete" onClick={() => deleteArt(art.id)} {...h}>
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

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </>
  );
}
