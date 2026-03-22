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
  const [longDesc, setLongDesc] = useState('');
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [video, setVideo] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState({ msg: '', type: 'ok', visible: false });
  const [hover, setHover] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  // Edit modal
  const [editArt, setEditArt] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLongDesc, setEditLongDesc] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editVideo, setEditVideo] = useState(null);
  const [editVideoName, setEditVideoName] = useState('');
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef();
  const videoInputRef = useRef();
  const dropRef = useRef();
  const editFileRef = useRef();
  const editVideoRef = useRef();
  const router = useRouter();

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
    try { const res = await fetch('/api/arts'); setArts(await res.json()); }
    catch { setArts([]); }
    setLoading(false);
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  function handleFile(f) {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { showToast('Imagen muy grande — máx 10 MB', 'error'); return; }
    setFile(f); setPreviewName(f.name);
    const r = new FileReader(); r.onload = e => setPreviewSrc(e.target.result); r.readAsDataURL(f);
  }

  function handleVideo(f) {
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) { showToast('Video muy grande — máx 100 MB', 'error'); return; }
    setVideo(f); setVideoName(f.name);
  }

  function clearFile(e) {
    e.stopPropagation();
    setFile(null); setPreviewSrc(null); setPreviewName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e) {
    e.preventDefault(); dropRef.current?.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  }

  async function publishArt() {
    if (!waNumber.trim()) { showToast('Ingresa tu número de WhatsApp', 'error'); return; }
    if (!title.trim())    { showToast('Escribe el título de la obra', 'error'); return; }
    if (!file)            { showToast('Selecciona una fotografía', 'error'); return; }
    setPublishing(true); setProgress(20);
    localStorage.setItem('ttWa', waNumber.trim());
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('desc', desc.trim());
      fd.append('longDesc', longDesc.trim());
      fd.append('wa', waNumber.replace(/\s+/g, ''));
      if (video) fd.append('video', video);
      setProgress(50);
      const res = await fetch('/api/arts', { method: 'POST', body: fd });
      setProgress(90);
      if (!res.ok) throw new Error();
      const newArt = await res.json();
      setArts(prev => [newArt, ...prev]);
      setTitle(''); setDesc(''); setLongDesc(''); setFile(null); setPreviewSrc(null); setPreviewName('');
      setVideo(null); setVideoName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      setProgress(100); setTimeout(() => setProgress(0), 600);
      showToast('Obra publicada');
    } catch { showToast('Error al publicar. Intenta de nuevo.', 'error'); setProgress(0); }
    setPublishing(false);
  }

  async function deleteArt(art) {
    if (!confirm(`¿Eliminar "${art.title}"?`)) return;
    try {
      const res = await fetch(`/api/arts/${art.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setArts(prev => prev.filter(a => a.id !== art.id));
      showToast('Obra eliminada');
    } catch { showToast('Error al eliminar', 'error'); }
  }

  async function toggleSold(art) {
    try {
      const res = await fetch(`/api/arts/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sold: !art.sold }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setArts(prev => prev.map(a => a.id === art.id ? updated : a));
      showToast(updated.sold ? 'Marcada como vendida' : 'Marcada como disponible');
    } catch { showToast('Error al actualizar', 'error'); }
  }

  function openEdit(art) {
    setEditArt(art); setEditTitle(art.title); setEditDesc(art.desc || ''); setEditLongDesc(art.longDesc || '');
    setEditFile(null); setEditPreview(null);
    setEditVideo(null); setEditVideoName(''); setRemoveVideo(false);
  }

  async function saveEdit() {
    if (!editTitle.trim()) { showToast('El título no puede estar vacío', 'error'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', editTitle.trim());
      fd.append('desc', editDesc.trim());
      fd.append('longDesc', editLongDesc.trim());
      if (editFile) fd.append('file', editFile);
      if (editVideo) fd.append('video', editVideo);
      if (removeVideo) fd.append('removeVideo', 'true');
      const res = await fetch(`/api/arts/${editArt.id}`, { method: 'PATCH', body: fd });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setArts(prev => prev.map(a => a.id === editArt.id ? updated : a));
      setEditArt(null);
      showToast('Obra actualizada');
    } catch { showToast('Error al guardar', 'error'); }
    setSaving(false);
  }

  async function logout() {
    await fetch('/api/admin-login', { method: 'DELETE' });
    router.push('/admin/login');
  }

  const h = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };

  return (
    <>
      <div id="cursor" className={hover ? 'hover' : ''} style={{ left: cursorPos.x, top: cursorPos.y }} />

      <header className="top-bar">
        <span style={{display:'flex',alignItems:'center',gap:12}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Logo" style={{width:38,height:38,borderRadius:'50%',objectFit:'cover',border:'1px solid rgba(250,250,249,.2)'}}/>
          <span className="nav-brand">Tiza &amp; Tinta — Pizarras</span>
        </span>
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
            <label className="field-label" htmlFor="desc">Descripción corta <span style={{ opacity: .5 }}>(opcional)</span></label>
            <input type="text" className="field-input" id="desc" placeholder="Dimensiones, técnica, materiales..."
              value={desc} onChange={e => setDesc(e.target.value)} {...h} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="longDesc">Descripción completa <span style={{ opacity: .5 }}>(opcional)</span></label>
            <textarea className="field-textarea" id="longDesc"
              placeholder="Cuéntanos la historia de esta obra, la técnica utilizada, la inspiración, el tiempo de elaboración..."
              value={longDesc} onChange={e => setLongDesc(e.target.value)} {...h} />
          </div>

          {/* IMAGE */}
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

          {/* VIDEO */}
          <div className="field">
            <label className="field-label">Video del proceso <span style={{ opacity: .5 }}>(opcional)</span></label>
            <div className="drop-zone" onClick={() => videoInputRef.current?.click()} {...h}>
              <div className="drop-icon-wrap">🎬</div>
              <p className="drop-text">{videoName || 'Pulsa para seleccionar video'}</p>
              <p className="drop-sub">MP4 · MOV · WEBM · Máx 100 MB</p>
            </div>
            {videoName && (
              <div className="preview-strip visible">
                <span style={{ fontSize: '1.4rem' }}>🎬</span>
                <span className="preview-name">{videoName}</span>
                <button className="preview-clear" onClick={() => { setVideo(null); setVideoName(''); videoInputRef.current.value = ''; }} {...h}>✕</button>
              </div>
            )}
            <input type="file" ref={videoInputRef} accept="video/*" style={{ display: 'none' }}
              onChange={e => handleVideo(e.target.files[0])} />
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
          <p className="manage-title">Gestionar obras ({loading ? '…' : arts.length}) · <span style={{opacity:.5,fontWeight:400}}>arrastra para reordenar</span></p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 74 }} />)}
            </div>
          ) : arts.length === 0 ? (
            <p className="manage-empty">No hay obras publicadas todavía.</p>
          ) : (
            <div className="manage-list"
              onDragOver={e => e.preventDefault()}>
              {arts.map((art, idx) => (
                <div className="manage-item" key={art.id}
                  draggable
                  onDragStart={e => { e.dataTransfer.setData('text/plain', String(art.id)); e.currentTarget.style.opacity = '.4'; }}
                  onDragEnd={e => { e.currentTarget.style.opacity = '1'; }}
                  onDrop={async e => {
                    e.preventDefault();
                    const draggedId = Number(e.dataTransfer.getData('text/plain'));
                    if (draggedId === art.id) return;
                    const newArts = [...arts];
                    const fromIdx = newArts.findIndex(a => a.id === draggedId);
                    const [moved] = newArts.splice(fromIdx, 1);
                    newArts.splice(idx, 0, moved);
                    setArts(newArts);
                    try {
                      await fetch('/api/arts/reorder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: newArts.map(a => a.id) }),
                      });
                      showToast('Orden guardado');
                    } catch { showToast('Error al guardar orden', 'error'); }
                  }}
                  style={{ cursor: 'grab' }}
                  {...h}>
                  <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '.7rem', userSelect: 'none', paddingRight: 4 }}>⠿</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="manage-thumb" src={art.imgUrl} alt={art.title} style={{ opacity: art.sold ? .5 : 1 }} />
                  <div className="manage-info">
                    <p className="manage-name">
                      {art.title}
                      {art.sold && <span className="sold-tag">Vendida</span>}
                      {art.videoUrl && <span className="video-tag">🎬</span>}
                    </p>
                    <p className="manage-meta">{art.desc || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn-manage" onClick={() => openEdit(art)} {...h} title="Editar">✎</button>
                    <button className={`btn-manage${art.sold ? ' btn-unsell' : ' btn-sell'}`}
                      onClick={() => toggleSold(art)} {...h} title={art.sold ? 'Marcar disponible' : 'Marcar vendida'}>
                      {art.sold ? '↩' : '✓'}
                    </button>
                    <button className="btn-manage btn-del" onClick={() => deleteArt(art)} {...h} title="Eliminar">✕</button>
                  </div>
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

      {/* EDIT MODAL */}
      {editArt && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditArt(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <p className="modal-title">Editar obra</p>
              <button className="drawer-close" onClick={() => setEditArt(null)} {...h}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label">Título</label>
                <input type="text" className="field-input" value={editTitle}
                  onChange={e => setEditTitle(e.target.value)} {...h} />
              </div>
              <div className="field">
                <label className="field-label">Descripción corta</label>
                <input type="text" className="field-input" value={editDesc}
                  onChange={e => setEditDesc(e.target.value)} placeholder="Dimensiones, técnica..." {...h} />
              </div>
              <div className="field">
                <label className="field-label">Descripción completa <span style={{ opacity: .5 }}>(opcional)</span></label>
                <textarea className="field-textarea" value={editLongDesc}
                  onChange={e => setEditLongDesc(e.target.value)}
                  placeholder="Historia de la obra, técnica, inspiración..." {...h} />
              </div>
              <div className="field">
                <label className="field-label">Cambiar foto <span style={{ opacity: .5 }}>(opcional)</span></label>
                <div className="drop-zone" onClick={() => editFileRef.current?.click()} {...h}>
                  <div className="drop-icon-wrap">📷</div>
                  <p className="drop-text">{editPreview ? 'Nueva foto seleccionada' : 'Pulsa para cambiar la foto'}</p>
                </div>
                {editPreview && (
                  <div className="preview-strip visible" style={{ marginTop: 7 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="preview-thumb" src={editPreview} alt="" />
                    <button className="preview-clear" onClick={() => { setEditFile(null); setEditPreview(null); editFileRef.current.value = ''; }} {...h}>✕</button>
                  </div>
                )}
                <input type="file" ref={editFileRef} accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (!f) return; setEditFile(f); const r = new FileReader(); r.onload = ev => setEditPreview(ev.target.result); r.readAsDataURL(f); }} />
              </div>
              <div className="field">
                <label className="field-label">
                  {editArt.videoUrl ? 'Cambiar video' : 'Añadir video del proceso'}
                  <span style={{ opacity: .5 }}> (opcional)</span>
                </label>
                <div className="drop-zone" onClick={() => editVideoRef.current?.click()} {...h}>
                  <div className="drop-icon-wrap">🎬</div>
                  <p className="drop-text">{editVideoName || (editArt.videoUrl ? 'Video actual · pulsa para cambiar' : 'Pulsa para añadir video')}</p>
                  <p className="drop-sub">MP4 · MOV · WEBM · Máx 100 MB</p>
                </div>
                {editVideoName && (
                  <div className="preview-strip visible" style={{ marginTop: 7 }}>
                    <span style={{ fontSize: '1.4rem' }}>🎬</span>
                    <span className="preview-name">{editVideoName}</span>
                    <button className="preview-clear" onClick={() => { setEditVideo(null); setEditVideoName(''); editVideoRef.current.value = ''; }} {...h}>✕</button>
                  </div>
                )}
                {editArt.videoUrl && !editVideoName && (
                  <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, cursor:'none' }}>
                    <input type="checkbox" checked={removeVideo} onChange={e => setRemoveVideo(e.target.checked)} />
                    <span className="field-hint">Eliminar video actual</span>
                  </label>
                )}
                <input type="file" ref={editVideoRef} accept="video/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (!f) return; setEditVideo(f); setEditVideoName(f.name); }} />
              </div>
              <div className="form-divider" />
              <button className="btn-publish" onClick={saveEdit} disabled={saving} {...h}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast.visible ? ' show' : ''}${toast.type === 'error' ? ' error' : ''}`}>
        {toast.msg}
      </div>
    </>
  );
}
