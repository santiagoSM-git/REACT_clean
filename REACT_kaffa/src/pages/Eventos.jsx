import { useRef, useState } from 'react';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { useEventos } from '../hooks/useEventos';

/** 'YYYY-MM-DD' (+ hora opcional) → fecha legible en español. */
function fechaEvento(evento) {
  if (!evento?.fecha) return '';
  const [anio, mes, dia] = String(evento.fecha).slice(0, 10).split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  if (Number.isNaN(fecha.getTime())) return String(evento.fecha);

  const texto = fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const hora = evento.hora ? String(evento.hora).slice(0, 5) : '';
  return hora ? `${texto} · ${hora}` : texto;
}

/**
 * Galería tipo publicación: scroll horizontal con snap (swipe táctil nativo)
 * + flechas en escritorio + puntos indicadores.
 */
function EventMedia({ imagenes, titulo }) {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const total = imagenes.length;

  const ir = (n) => {
    const track = trackRef.current;
    if (!track) return;
    const destino = Math.max(0, Math.min(total - 1, n));
    track.scrollTo({ left: destino * track.clientWidth, behavior: 'smooth' });
    setIdx(destino);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const actual = Math.round(track.scrollLeft / track.clientWidth);
    setIdx((prev) => (actual !== prev ? actual : prev));
  };

  if (!total) {
    return (
      <div className="event-media event-media-empty" aria-hidden="true">
        <i className="fa-solid fa-calendar-days"></i>
      </div>
    );
  }

  return (
    <div className="event-media">
      <div className="event-media-track" ref={trackRef} onScroll={onScroll}>
        {imagenes.map((url, i) => (
          <div className="event-media-slide" key={`${url}-${i}`}>
            <img src={url} alt={`${titulo} — imagen ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="event-media-nav prev"
            onClick={() => ir(idx - 1)}
            disabled={idx === 0}
            aria-label="Imagen anterior"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            className="event-media-nav next"
            onClick={() => ir(idx + 1)}
            disabled={idx === total - 1}
            aria-label="Imagen siguiente"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <div className="event-media-dots">
            {imagenes.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`event-media-dot${i === idx ? ' active' : ''}`}
                onClick={() => ir(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Eventos() {
  useStyles(['style.css']);
  useBodyClass('eventos-page');

  const { eventos, cargando, error, reintentar } = useEventos();

  return (
    <section className="featured eventos-section" style={{ paddingTop: '120px' }}>
      <div className="section-header">
        <span className="section-tag">Eventos</span>
        <h2>Próximos Eventos</h2>
        <p>Participamos en las ferias y concursos de café más importantes de Colombia.</p>
      </div>

      {cargando ? (
        <p className="team-status">Cargando eventos…</p>
      ) : error ? (
        <div className="team-status team-error">
          <p>⚠️ {error}</p>
          <button type="button" onClick={reintentar}>Reintentar</button>
        </div>
      ) : eventos.length === 0 ? (
        <p className="team-status">Pronto anunciaremos nuestros próximos eventos.</p>
      ) : (
        <div className="eventos-grid">
          {eventos.map((evento) => (
            <article className="event-card" key={evento.id}>
              <EventMedia
                imagenes={(evento.imagenes || []).map((im) => im.url)}
                titulo={evento.titulo}
              />
              <div className="event-card-body">
                <span className="event-date">{fechaEvento(evento)}</span>
                <h3>{evento.titulo}</h3>
                {evento.lugar && (
                  <p className="event-lugar">
                    <i className="fa-solid fa-location-dot"></i> {evento.lugar}
                  </p>
                )}
                <p>{evento.descripcion}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Eventos;
