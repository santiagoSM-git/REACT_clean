import { useStyles } from '../hooks/useStyles';
import { PUBLIC } from '../lib/styleManifest';

const DETALLES = [
  {
    icono: '📍',
    titulo: 'Dirección',
    texto: (
      <>
        Calle 4 #2-80, SENA Centro de Comercio y Servicios
        <br />
        Popayán, Colombia
      </>
    ),
  },
  {
    icono: '📞',
    titulo: 'Teléfono',
    texto: <a href="tel:+573116364752">+57 311 636 4752</a>,
  },
  {
    icono: '✉️',
    titulo: 'Email',
    texto: <a href="mailto:atulande@sena.edu.co">atulande@sena.edu.co</a>,
  },
  {
    icono: '🕐',
    titulo: 'Horario',
    texto: (
      <>
        Lunes a viernes: 7:00 a. m. - 6:00 p. m.
        <br />
        Sábados y domingos: Cerrado
      </>
    ),
  },
];

function Contacto() {
  useStyles(PUBLIC);

  return (
    <section className="contact-page">
      <div className="contact-grid">
        <div className="contact-info-section">
          <span className="section-tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
            Contáctanos
          </span>
          <h2>Estamos aquí para servirte</h2>
          <p>
            ¿Te gustaría saber más sobre nuestra cafetería, dejar una sugerencia o simplemente
            saludarnos? Estamos listos para prepararte el mejor café.
          </p>

          <div className="contact-details">
            {DETALLES.map((detalle) => (
              <div className="contact-detail-item" key={detalle.titulo}>
                <div className="contact-detail-icon">{detalle.icono}</div>
                <div className="contact-detail-text">
                  <h4>{detalle.titulo}</h4>
                  <p>{detalle.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="contact-image-section">
          <img
            className="contact-map-image"
            src="/imagenes/mapa-kaffa.jpeg"
            alt="Mapa de ubicación de KAFFA en el SENA Centro de Comercio y Servicios, Popayán"
            width={1080}
            height={1404}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export default Contacto;
