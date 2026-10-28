/**
 * KAFFA - Catálogo real para el sitio público.
 *
 * La API es la única fuente de verdad: si no hay productos registrados, la
 * lista queda vacía (no se muestra el catálogo demo). Si la API falla, también
 * queda vacía y se expone `error` para que la vista muestre un mensaje.
 */
import { useEffect, useState } from 'react';
import { Api } from '../lib/api';

const IMAGEN_DEFAULT = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';

function normalizarApi(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion || '',
    imagen: producto.imagen || IMAGEN_DEFAULT,
    precio: Number(producto.precio_venta) || 0,
    real: true,
    raw: producto,
  };
}

export function useCatalogo() {
  const [estado, setEstado] = useState({
    productos: [],
    categorias: [],
    cargando: true,
    error: null,
  });

  useEffect(() => {
    let vivo = true;

    Promise.allSettled([
      Api.get('/productos', { per_page: 100, activo: 1 }),
      Api.get('/categorias', { per_page: 100 }),
    ]).then(([productosResp, categoriasResp]) => {
      if (!vivo) return;

      // Un fallo en categorías no debe ocultar los productos.
      if (productosResp.status === 'rejected') {
        setEstado({
          productos: [],
          categorias: [],
          cargando: false,
          error: productosResp.reason || new Error('No se pudo cargar el catálogo.'),
        });
        return;
      }

      const items = Api.unwrapList(productosResp.value).items;
      const categorias = categoriasResp.status === 'fulfilled'
        ? Api.unwrapList(categoriasResp.value).items
        : [];

      setEstado({
        productos: items.map(normalizarApi),
        categorias,
        cargando: false,
        error: null,
      });
    });

    return () => {
      vivo = false;
    };
  }, []);

  return estado;
}
