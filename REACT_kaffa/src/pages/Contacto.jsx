import { useStyles } from '../hooks/useStyles';

const DETALLES = [
  {
    icono: '📍',
    titulo: 'Dirección',
    texto: (
      <>
        Calle 4 #2-80, SENA Centro Comercio y Servicio
        <br />
        Popayán, Colombia
      </>
    ),
  },
  { icono: '📞', titulo: 'Teléfono', texto: '+57 300 000 0000' },
  { icono: '✉️', titulo: 'Email', texto: 'contacto@kaffa.com' },
  {
    icono: '🕐',
    titulo: 'Horario',
    texto: (
      <>
        Lunes - Viernes: 8:00 a.m - 5:00 p.m
        <br />
        Sábados: 8:00 a.m - 12:00 p.m
      </>
    ),
  },
];

function Contacto() {
  useStyles(['style.css']);

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

          <div className="contact-social">
            <h3>Síguenos en redes</h3>
            <div className="contact-social-links">
              <a href="#" aria-label="Facebook">
                Fb
              </a>
              <a href="#" aria-label="Instagram">
                Ig
              </a>
              <a href="#" aria-label="TikTok">
                Tk
              </a>
            </div>
          </div>
        </div>

        <div className="contact-image-section">
          <div
            className="contact-map-image"
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '0.9rem',
            }}
          >
            Mapa de ubicación
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contacto;
