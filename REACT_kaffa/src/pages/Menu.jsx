import { useStyles } from '../hooks/useStyles';
import { ProductosStore } from '../lib/productos-store';
import ProductCard from '../components/product/ProductCard';

const CATEGORIAS = ['Cafés', 'Postres', 'Snacks'];

function Menu() {
  useStyles(['style.css']);

  return (
    <section className="featured" style={{ paddingTop: '120px' }}>
      <div className="section-header">
        <span className="section-tag">Catálogo</span>
        <h2>Nuestro Menú</h2>
        <p>Selección de cafés artesanales, postres caseros y snacks preparados con los mejores ingredientes.</p>
      </div>

      {CATEGORIAS.map((categoria) => (
        <div key={categoria}>
          <span
            className="section-tag"
            style={{
              display: 'inline-block',
              margin: '0 auto 10px',
              textAlign: 'center',
              width: 'auto',
              background: 'var(--color-blanco)',
              border: '1px solid var(--border)',
              padding: '6px 24px',
            }}
          >
            {categoria}
          </span>
          <div className="featured-grid" style={{ marginBottom: '60px' }}>
            {ProductosStore.obtenerPorCategoria(categoria).map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default Menu;
