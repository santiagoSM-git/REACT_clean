import { useStyles } from '../hooks/useStyles';

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

const EQUIPO = [
  {
    src: 'https://img.freepik.com/foto-gratis/barista-profesional-trabajo-cafe_176532-11596.jpg',
    nombre: 'María González',
    cargo: 'Jefa de Baristas',
  },
  {
    src: 'https://th.bing.com/th/id/R.5515c12d795c758e71b3768428189417?rik=EDJxiU67uyAuxQ&pid=ImgRaw&r=0',
    nombre: 'Andrés Rivera',
    cargo: 'Tostador / Catador',
  },
  {
    src: 'https://excelso77.com/wp-content/uploads/2024/02/que-hace-un-barista-profesional-te-lo-contamos-a-detalle.webp',
    nombre: 'Laura Méndez',
    cargo: 'Experta en Métodos',
  },
  {
    src: 'https://www.emcebar.org.mx/storage/2024/11/43b1ceec3e969edfbfb2c2e93dfca92a.webp',
    nombre: 'Carlos R.',
    cargo: 'Atención al Cliente',
  },
];

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

      <section className="about-team">
        <div className="section-header">
          <span className="section-tag">Equipo</span>
          <h2>Nuestro Equipo</h2>
          <p>Un grupo de baristas y apasionados que traen KAFFA a la vida.</p>
        </div>
        <div className="team-grid">
          {EQUIPO.map((miembro) => (
            <div className="team-card" key={miembro.nombre}>
              <img src={miembro.src} alt={miembro.nombre} loading="lazy" />
              <h4>{miembro.nombre}</h4>
              <p>{miembro.cargo}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default SobreNosotros;
