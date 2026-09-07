import { useState } from 'react';
import { useStyles } from '../hooks/useStyles';
import { ProductosStore } from '../lib/productos-store';
import { useCatalogo } from '../hooks/useCatalogo';
import ProductCard from '../components/product/ProductCard';

const CATEGORIAS = ['Cafés', 'Postres', 'Snacks'];

function Menu() {
  useStyles(['style.css']);
  const { productos, categorias, esDemo } = useCatalogo();
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  // ── Catálogo real (API): filtros por chips + grid ──
  if (!esDemo) {
    const lista = categoriaActiva === null ? productos : productos.filter((p) => p.raw?.categoria_id == categoriaActiva);
    return (
      <section className="featured" style={{ paddingTop: '120px' }}>
        <div className="section-header">
          <span className="section-tag">Catálogo</span>
          <h2>Nuestro Menú</h2>
          <p>Selección de cafés artesanales, postres caseros y snacks preparados con los mejores ingredientes.</p>
        </div>

        <div className="menu-filtros">
          <button type="button" className={`menu-chip${categoriaActiva === null ? ' active' : ''}`} onClick={() => setCategoriaActiva(null)}>
            Todos
          </button>
          {categorias.map((c) => (
            <button key={c.id} type="button" className={`menu-chip${categoriaActiva == c.id ? ' active' : ''}`} onClick={() => setCategoriaActiva(c.id)}>
              {c.nombre}
            </button>
          ))}
        </div>

        <div className="featured-grid" style={{ marginBottom: '60px' }}>
          {lista.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
          {lista.length === 0 && <p style={{ textAlign: 'center', width: '100%' }}>Sin productos en esta categoría.</p>}
        </div>
      </section>
    );
  }

  // ── Sin backend: catálogo estático de demostración (igual que antes) ──
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
