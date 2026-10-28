import { useEffect, useState } from 'react';
import { useStyles } from '../hooks/useStyles';
import { PUBLIC } from '../lib/styleManifest';
import { useCatalogo } from '../hooks/useCatalogo';
import { useFavoritos } from '../context/FavoritosContext';
import ProductCard from '../components/product/ProductCard';

function Menu() {
  useStyles(PUBLIC);

  const { productos, categorias, cargando, error } = useCatalogo();
  const { podarFavoritos } = useFavoritos();
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  // Limpia favoritos de productos que ya no existen en el catálogo.
  useEffect(() => {
    if (!cargando && !error) {
      podarFavoritos(productos.map((producto) => producto.id));
    }
  }, [cargando, error, productos, podarFavoritos]);

  const encabezado = (
    <div className="section-header">
      <span className="section-tag">Catálogo</span>
      <h2>Nuestro Menú</h2>
      <p>Selección de cafés artesanales, postres caseros y snacks preparados con los mejores ingredientes.</p>
    </div>
  );

  if (cargando) {
    return (
      <section className="featured" style={{ paddingTop: '120px' }}>
        {encabezado}
        <p style={{ textAlign: 'center', width: '100%' }}>Cargando menú...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured" style={{ paddingTop: '120px' }}>
        {encabezado}
        <p style={{ textAlign: 'center', width: '100%' }}>
          No se pudo cargar el catálogo. Intenta de nuevo en unos minutos.
        </p>
      </section>
    );
  }

  const lista = categoriaActiva === null
    ? productos
    : productos.filter((producto) => producto.raw?.categoria_id == categoriaActiva);

  return (
    <section className="featured" style={{ paddingTop: '120px' }}>
      {encabezado}

      {productos.length > 0 && categorias.length > 0 && (
        <div className="menu-filtros">
          <button
            type="button"
            className={`menu-chip${categoriaActiva === null ? ' active' : ''}`}
            onClick={() => setCategoriaActiva(null)}
          >
            Todos
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              className={`menu-chip${categoriaActiva == categoria.id ? ' active' : ''}`}
              onClick={() => setCategoriaActiva(categoria.id)}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="featured-grid" style={{ marginBottom: '60px' }}>
        {lista.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
        {lista.length === 0 && (
          <p style={{ textAlign: 'center', width: '100%' }}>
            {productos.length === 0
              ? 'Aún no hay productos registrados. El administrador los agregará pronto.'
              : 'Sin productos en esta categoría.'}
          </p>
        )}
      </div>
    </section>
  );
}

export default Menu;
