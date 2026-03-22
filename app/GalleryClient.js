'use client';
import { useEffect, useState } from 'react';

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

function WaIcon({ size = 11 }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: 'currentColor', flexShrink: 0 }}>
      <path d={WA_PATH} />
    </svg>
  );
}

function waLink(art) {
  const clean = art.wa.replace(/[^\d+]/g, '');
  const msg = encodeURIComponent(`¡Hola! Vi tu obra *${art.title}* en Tiza & Tinta y me interesa. ¿Podemos hablar?`);
  return `https://wa.me/${clean}?text=${msg}`;
}

export default function GalleryClient({ initialArts }) {
  const [arts] = useState(initialArts || []);
  const [lightbox, setLightbox] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const onMove = e => setCursorPos({ x: e.clientX, y: e.clientY });
    const onKey = e => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('keydown', onKey); };
  }, []);

  const h = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };

  return (
    <>
      <div id="cursor" className={hover ? 'hover' : ''} style={{ left: cursorPos.x, top: cursorPos.y }} />

      <header className="top-bar">
        <span className="nav-brand">Tiza &amp; Tinta</span>
        <span className="nav-tagline">Arte sobre pizarra, hecho a mano</span>
      </header>

      <section className="hero">
        <div className="hero-title">
          <span>Tiza</span>
          <em>&amp; Tinta</em>
        </div>
        <div className="hero-right">
          <p className="hero-desc">Arte original sobre pizarra. Cada pieza es única, trazada a mano con tiza y tinta. Disponibles para adquirir.</p>
          <div className="hero-meta">
            <div className="meta-item"><span className="meta-count">{arts.length}</span>Obras</div>
            <div className="meta-item"><span className="meta-count">100%</span>Hecho a mano</div>
          </div>
        </div>
      </section>

      <section className="gallery-wrapper">
        <div className="gallery-header">
          <span className="gallery-label">Colección · Obras disponibles</span>
        </div>
        <div className="gallery-grid">
          {arts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-num">0</span>
              <p className="empty-text">Aún no hay obras publicadas</p>
              <p className="empty-hint">Pronto habrá nuevas piezas disponibles</p>
            </div>
          ) : arts.map((art, i) => (
            <div key={art.id} className="art-card" style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => setLightbox({ art, idx: i })} {...h}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art.imgUrl} alt={art.title} loading="lazy" />
              <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="card-info">
                <div className="card-text">
                  <p className="card-title">{art.title}</p>
                  {art.desc && <p className="card-desc">{art.desc}</p>}
                </div>
                <a className="btn-wa" href={waLink(art)} target="_blank" rel="noopener"
                  onClick={e => e.stopPropagation()} {...h}>
                  <WaIcon /> Lo quiero
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <span className="footer-brand">Tiza &amp; Tinta — Pizarras</span>
        <span className="footer-copy">Arte Hecho a Mano</span>
      </footer>

      {lightbox && (
        <div className="lightbox open" onClick={e => { if (e.target === e.currentTarget) setLightbox(null); }}>
          <button className="lb-close" onClick={() => setLightbox(null)}>✕</button>
          <div className="lb-inner">
            <div className="lb-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="lb-img" src={lightbox.art.imgUrl} alt={lightbox.art.title} />
            </div>
            <div className="lb-sidebar">
              <span className="lb-num">Obra {String(lightbox.idx + 1).padStart(2, '0')}</span>
              <h2 className="lb-title">{lightbox.art.title}</h2>
              <p className="lb-desc">{lightbox.art.desc || 'Arte original sobre pizarra, hecho a mano.'}</p>
              <div className="lb-divider" />
              <div>
                <a className="btn-lb-wa" href={waLink(lightbox.art)} target="_blank" rel="noopener">
                  <WaIcon size={13} /> Lo quiero — Contactar artista
                </a>
                <p className="lb-hint">Abre WhatsApp directamente</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
