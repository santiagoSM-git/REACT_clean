import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/menu', label: 'Menú' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/sobre-nosotros', label: 'Sobre Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

function Footer() {
  return (
    <footer id="main-footer">
      <div className="footer-content">
        <div className="footer-section">
          <img className="footer-logo" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
          <p>El arte del buen café artesanal con aroma y tradición.</p>
        </div>
        <div className="footer-section">
          <h3>Horarios</h3>
          <ul className="footer-hours">
            <li>
              <strong>Lunes a viernes:</strong> 7:00 a. m. - 6:00 p. m.
            </li>
            <li>
              <strong>Sábados y domingos:</strong> Cerrado
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contacto</h3>
          <ul className="footer-contact">
            <li>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Calle 4 #2-80, SENA Centro de Comercio y Servicios, Popayán, Colombia
            </li>
            <li>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <a href="tel:+573116364752">+57 311 636 4752</a>
            </li>
            <li>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <a href="mailto:atulande@sena.edu.co">atulande@sena.edu.co</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Enlaces Rápidos</h3>
          <ul className="footer-links" id="footer-quick-links">
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
            <li>
              <a
                href="/manual/index.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Manual de uso
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 KAFFA Café artesanal.</p>
      </div>
    </footer>
  );
}

export default Footer;
