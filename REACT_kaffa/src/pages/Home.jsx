import { Link } from 'react-router-dom';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { ProductosStore } from '../lib/productos-store';
import ProductCard from '../components/product/ProductCard';

function Home() {
  useStyles(['style.css']);
  useBodyClass('home-page');

  const destacados = ProductosStore.obtenerTodos()
    .filter((p) => p.categoria === 'Cafés')
    .slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="hero-tag">Café de especialidad</span>
            <h1>
              El Arte del
              <br />
              <span>Buen Café</span>
            </h1>
            <p>
              Descubre nuestra selección de granos premium, tostados artesanalmente
              para ofrecerte una experiencia única en cada taza.
            </p>
            <div className="hero-buttons">
              <Link to="/menu" className="hero-btn-primary">
                Ver Menú
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link to="/sobre-nosotros" className="hero-btn-secondary">
                Conocer más
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop"
              alt="Taza de café artesanal"
            />
            <div className="hero-badge">
              <div className="hero-badge-icon">☕</div>
              <div className="hero-badge-text">
                <strong>100% Colombiano</strong>
                <span>Granos de origen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="featured">
        <div className="section-header">
          <span className="section-tag">Recomendados</span>
          <h2>Nuestros Favoritos</h2>
          <p>Los más vendidos de nuestra cafetería, seleccionados por nuestros clientes.</p>
        </div>
        <div className="featured-grid" id="productos-container">
          {destacados.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="about-preview">
        <div className="about-preview-inner">
          <img
            className="about-preview-image"
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop"
            alt="Cafetería KAFFA"
          />
          <div className="about-preview-content">
            <span className="section-tag">Nuestra historia</span>
            <h2>Pasión por el Café Artesanal</h2>
            <p>
              En KAFFA seleccionamos los mejores granos colombianos y los tostamos
              artesanalmente para resaltar sus notas únicas. Cada taza cuenta una
              historia de tradición, calidad y amor por el café.
            </p>
            <Link to="/sobre-nosotros" className="btn-primary">
              Conoce más
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
