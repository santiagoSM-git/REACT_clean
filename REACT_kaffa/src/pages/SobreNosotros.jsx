import { useState } from 'react';
import { useStyles } from '../hooks/useStyles';
import { useEquipo } from '../hooks/useEquipo';

const VALORES = [
  {
    icono: '🎯',
    titulo: 'Misión',
    texto: 'Ofrecer experiencias memorables a través del café, conectando a las personas con sabores auténticos.',
  },
  {
    icono: '🔭',
    titulo: 'Visión',
    texto: 'Ser un referente local en café de especialidad, reconocidos por calidad, sostenibilidad y comunidad.',
  },
  {
    icono: '💚',
    titulo: 'Valores',
    texto: 'Calidad · Transparencia · Respeto por la tierra · Cercanía con la comunidad',
  },
];

const GALERIA = [
  {
    src: 'https://amazonical.com/wp-content/uploads/2020/05/Granos-de-cafe-47009229_s.jpg',
    alt: 'Granos de café',
  },
  {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQffRxXSEzQ55B6xmvZDheDe7oplIa9dbFecQ&s',
    alt: 'Taza de café',
  },
  {
    src: 'https://www.baque.com/wp-content/uploads/2016/08/leer-con-un-buen-cafe.jpg',
    alt: 'Café y libro',
  },
  {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_4Ji_iVcNRIFPdPZOsJIkjpy5iMhzL8-tIA&s',
    alt: 'Latte art',
  },
];

// Turnos del negocio (valores que entiende el backend: tabla `turnos.tipo`).
const TURNOS = [
  { valor: 'mañana', etiqueta: 'Mañana' },
  { valor: 'tarde', etiqueta: 'Tarde' },
];

/** Fecha de hoy en formato YYYY-MM-DD usando la hora local (sin desfase UTC). */
function hoyLocal() {
  return new Date().toLocaleDateString('en-CA');
}

/** Turno actual según el horario del negocio (mañana 07-13, tarde 13-18). */
function turnoActual() {
  return new Date().getHours() < 13 ? 'mañana' : 'tarde';
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' en hora local (sin desfase de zona horaria). */
function fechaLegible(fechaISO) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function TeamCard({ foto, nombre, rol, meta }) {
  return (
    <div className="team-card">
      {foto ? (
        <img src={foto} alt={nombre} loading="lazy" />
      ) : (
        <div className="team-card-fallback" aria-hidden="true">
          {(nombre || '?').charAt(0).toUpperCase()}
        </div>
      )}
      <h4>{nombre}</h4>
      <p>{rol}</p>
      {meta && <p className="team-card-meta">{meta}</p>}
    </div>
  );
}

function EquipoSection() {
  const [fecha, setFecha] = useState(hoyLocal);
  const [tipo, setTipo] = useState(turnoActual);
  const { administradora, baristas, cargando, error, reintentar } = useEquipo(fecha, tipo);

  const turnoLabel = TURNOS.find((t) => t.valor === tipo)?.etiqueta || tipo;

  return (
    <section className="about-team">
      <div className="section-header">
        <span className="section-tag">Equipo</span>
        <h2>Nuestro Equipo</h2>
        <p>Un grupo de baristas y apasionados que traen KAFFA a la vida.</p>
      </div>

      <div className="team-controls">
        <label className="team-control">
          <span>Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
          />
        </label>
        <div className="team-turnos" role="group" aria-label="Turno">
          {TURNOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              className={t.valor === tipo ? 'active' : ''}
              aria-pressed={t.valor === tipo}
              onClick={() => setTipo(t.valor)}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {cargando && !administradora ? (
        <p className="team-status">Cargando equipo…</p>
      ) : error && !administradora ? (
        <div className="team-status team-error">
          <p>⚠️ {error}</p>
          <button type="button" onClick={reintentar}>Reintentar</button>
        </div>
      ) : (
        <div className="team-grid">
          {administradora && (
            <TeamCard
              foto={administradora.foto}
              nombre={administradora.nombre}
              rol="Administradora"
            />
          )}
          {error ? (
            <div className="team-status team-error team-grid-msg">
              <p>⚠️ {error}</p>
              <button type="button" onClick={reintentar}>Reintentar</button>
            </div>
          ) : cargando ? (
            <p className="team-status team-grid-msg">Cargando baristas…</p>
          ) : baristas.length === 0 ? (
            <p className="team-status team-grid-msg">
              No hay baristas asignados para este turno.
            </p>
          ) : (
            baristas.map((b) => (
              <TeamCard
                key={b.id}
                foto={b.foto}
                nombre={b.nombre}
                rol="Barista"
                meta={`${fechaLegible(fecha)} · ${turnoLabel}`}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function SobreNosotros() {
  useStyles(['style.css']);

  return (
    <>
      <section className="page-header">
        <span className="section-tag">Nuestra historia</span>
        <h1>Pasión, aroma y tradición en cada taza</h1>
        <p>En KAFFA combinamos raíces artesanales con técnicas modernas para ofrecerte una experiencia única.</p>
      </section>

      <section className="about-story">
        <div className="about-story-inner">
          <img
            className="about-story-image"
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop"
            alt="Cafetería KAFFA"
            loading="lazy"
          />
          <div className="about-story-text">
            <h2>Nuestra Historia</h2>
            <p>
              KAFFA nació del deseo de rescatar la tradición del café artesanal y renovarla con técnicas contemporáneas. Desde la selección de granos hasta la atención en cada taza, trabajamos con dedicación para que cada sorbo cuente una historia.
            </p>
            <p>
              Porque creemos que el café es cultura. Nuestros proveedores son pequeños productores comprometidos con prácticas sostenibles. Nosotros tostamos con cuidado, preparamos con atención y servimos con cariño.
            </p>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="section-header">
          <span className="section-tag">Nuestra esencia</span>
          <h2>Misión, Visión y Valores</h2>
          <p>Lo que nos impulsa cada día a ofrecer el mejor café.</p>
        </div>
        <div className="values-grid">
          {VALORES.map((valor) => (
            <div className="value-card" key={valor.titulo}>
              <div className="value-card-icon">{valor.icono}</div>
              <h4>{valor.titulo}</h4>
              <p>{valor.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-gallery">
        <div className="section-header">
          <span className="section-tag">Galería</span>
          <h2>La Experiencia KAFFA</h2>
          <p>Aromas, texturas y momentos que inspiran.</p>
        </div>
        <div className="gallery-grid">
          {GALERIA.map((img) => (
            <div className="gallery-item" key={img.src}>
              <img src={img.src} alt={img.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <EquipoSection />
    </>
  );
}

export default SobreNosotros;
