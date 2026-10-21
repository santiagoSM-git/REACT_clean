import { Storage } from './storage';

const KEY = 'kaffaPromociones';
const CHANGE_EVENT = 'kaffa-promociones-change';

export const TIPOS_PROMOCION = [
  { valor: 'descuento', label: 'Descuento', icono: 'fa-percent' },
  { valor: '2x1', label: '2x1', icono: 'fa-layer-group' },
  { valor: 'combo', label: 'Combo', icono: 'fa-burger' },
];

export const PALETA_PROMOCIONES = [
  { valor: '#e8f0e0', nombre: 'Verde salvia' },
  { valor: '#f0e7d8', nombre: 'Crema' },
  { valor: '#e7ece6', nombre: 'Verde niebla' },
  { valor: '#efe6e2', nombre: 'Arena rosada' },
  { valor: '#e3ece9', nombre: 'Menta suave' },
  { valor: '#eee9df', nombre: 'Avena' },
  { valor: '#e6e9f0', nombre: 'Azul niebla' },
  { valor: '#f1e8e4', nombre: 'Durazno suave' },
];

function notificar() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizar(promo) {
  return {
    id: promo.id || nuevoId(),
    nombre: String(promo.nombre || '').trim(),
    mensaje: String(promo.mensaje || '').trim(),
    tipo: TIPOS_PROMOCION.some((t) => t.valor === promo.tipo) ? promo.tipo : 'descuento',
    color: promo.color || PALETA_PROMOCIONES[0].valor,
    fecha_vencimiento: promo.fecha_vencimiento || null,
    enlace: String(promo.enlace || '').trim(),
    imagen: promo.imagen || '',
    activa: promo.activa !== false,
    creada_en: promo.creada_en || new Date().toISOString(),
  };
}

export const PromocionesStore = {
  KEY,
  CHANGE_EVENT,

  listar() {
    const lista = Storage.get(KEY, []);
    return Array.isArray(lista) ? lista.map(normalizar) : [];
  },

  guardar(lista) {
    Storage.set(KEY, lista);
    notificar();
  },

  crear(data) {
    const promo = normalizar({ ...data, id: nuevoId(), creada_en: new Date().toISOString() });
    PromocionesStore.guardar([...PromocionesStore.listar(), promo]);
    return promo;
  },

  actualizar(id, data) {
    const lista = PromocionesStore.listar();
    const indice = lista.findIndex((p) => String(p.id) === String(id));
    if (indice === -1) return null;

    lista[indice] = normalizar({ ...lista[indice], ...data, id: lista[indice].id });
    PromocionesStore.guardar(lista);
    return lista[indice];
  },

  eliminar(id) {
    PromocionesStore.guardar(
      PromocionesStore.listar().filter((p) => String(p.id) !== String(id)),
    );
  },

  cambiarActiva(id, activa) {
    return PromocionesStore.actualizar(id, { activa: !!activa });
  },

  estaVencida(promo, ahora = Date.now()) {
    if (!promo?.fecha_vencimiento) return false;
    const fecha = new Date(promo.fecha_vencimiento).getTime();
    return !Number.isNaN(fecha) && fecha <= ahora;
  },

  vigentes(ahora = Date.now()) {
    return PromocionesStore.listar().filter(
      (promo) => promo.activa && !PromocionesStore.estaVencida(promo, ahora),
    );
  },

  obtenerTipo(valor) {
    return TIPOS_PROMOCION.find((tipo) => tipo.valor === valor) || TIPOS_PROMOCION[0];
  },
};
