/**
 * KAFFA - Catálogo real para el sitio público
 * Lee la API (/productos + /categorias). Si la API no responde o viene vacía,
 * mantiene el catálogo estático de demostración (no comprable).
 */
import { useEffect, useState } from 'react';
import { Api } from '../lib/api';
import { ProductosStore } from '../lib/productos-store';

function normalizarApi(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion || '',
    imagen: p.imagen || ProductosStore.IMAGEN_DEFAULT,
    precio: Number(p.precio_venta) || 0,
    real: true,
    raw: p,
  };
}

function normalizarEstatico(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion || '',
    imagen: p.imagen || ProductosStore.IMAGEN_DEFAULT,
    precio: Number(p.precio) || 0,
    real: false,
    raw: null,
  };
}

export function useCatalogo() {
  const [estado, setEstado] = useState(() => ({
    productos: ProductosStore.obtenerTodos().map(normalizarEstatico),
    categorias: [],
    cargando: true,
    esDemo: true,
  }));

  useEffect(() => {
    let vivo = true;
    Promise.all([
      Api.get('/productos', { per_page: 100, activo: 1 }),
      Api.get('/categorias', { per_page: 100 }),
    ])
      .then(([pResp, cResp]) => {
        const items = Api.unwrapList(pResp).items;
        if (!vivo) return;
        if (!items.length) {
          setEstado((e) => ({ ...e, cargando: false }));
          return;
        }
        setEstado({
          productos: items.map(normalizarApi),
          categorias: Api.unwrapList(cResp).items,
          cargando: false,
          esDemo: false,
        });
      })
      .catch(() => {
        if (vivo) setEstado((e) => ({ ...e, cargando: false }));
      });
    return () => {
      vivo = false;
    };
  }, []);

  return estado;
}
