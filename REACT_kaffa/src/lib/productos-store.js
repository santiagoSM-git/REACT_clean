/**
 * KAFFA - Almacén de productos del menú
 * Portado desde js/productos-store.js a ES module.
 * Fuente única del catálogo: productos base (data/productos.js) + productos creados por baristas.
 * Los productos personalizados se persisten en localStorage bajo la clave kaffaProductosMenu.
 */
import { Storage } from './storage';
import { productosData } from '../data/productos';

export const ProductosStore = {
  KEY: 'kaffaProductosMenu',

  IMAGEN_DEFAULT: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',

  // ── PRODUCTOS PERSONALIZADOS ──
  getCustom: () => Storage.get(ProductosStore.KEY, []),
  setCustom: (lista) => Storage.set(ProductosStore.KEY, lista),

  addProducto: (data) => {
    const lista = ProductosStore.getCustom();
    const nuevo = {
      id: data.id || Date.now(),
      origen: 'personalizado',
      descripcion: '',
      imagen: ProductosStore.IMAGEN_DEFAULT,
      ...data,
    };
    nuevo.id = data.id || Date.now();
    nuevo.origen = 'personalizado';
    lista.push(nuevo);
    ProductosStore.setCustom(lista);
    return nuevo;
  },

  updateProducto: (id, data) => {
    const lista = ProductosStore.getCustom();
    const idx = lista.findIndex((p) => p.id == id);
    if (idx === -1) return false;
    lista[idx] = { ...lista[idx], ...data, id: lista[idx].id, origen: 'personalizado' };
    ProductosStore.setCustom(lista);
    return true;
  },

  deleteProducto: (id) => {
    ProductosStore.setCustom(ProductosStore.getCustom().filter((p) => p.id != id));
  },

  // ── CATÁLOGO COMPLETO ──
  obtenerTodos: () => [...productosData, ...ProductosStore.getCustom()],

  obtenerPorCategoria: (categoria) =>
    ProductosStore.obtenerTodos().filter((p) => p.categoria === categoria),

  esProductoPersonalizado: (producto) => producto && producto.origen === 'personalizado',
};
