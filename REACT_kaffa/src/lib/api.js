/**
 * KAFFA - Cliente HTTP de la API Laravel (React)
 * Fachada sobre la instancia central de Axios (./axiosClient).
 * Mantiene el contrato histórico de Api.* para no tocar los consumidores:
 * los datos se resuelven directamente (sin .json()) y los errores llegan
 * como ApiError con status, errors y code.
 */
import { apiClient, API_BASE } from './axiosClient';
import { ApiError } from './apiError';

export { API_BASE, ApiError };

export const Api = {
  BASE: API_BASE,

  // ── Sesión (token) ──

  getToken: () => localStorage.getItem('kaffaToken'),
  setToken: (t) => localStorage.setItem('kaffaToken', t),
  clearToken: () => localStorage.removeItem('kaffaToken'),

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('kaffaUser')) || null;
    } catch {
      return null;
    }
  },
  setUser: (u) => localStorage.setItem('kaffaUser', JSON.stringify(u)),

  // ── Núcleo ──

  async request(path, options = {}) {
    const response = await apiClient.request({
      url: path,
      method: options.method || 'GET',
      data: options.body,
      params: options.params,
      headers: options.headers,
      signal: options.signal,
    });

    // Axios ya entrega el cuerpo parseado en response.data. Las respuestas
    // 204/vacías se normalizan a null, igual que antes.
    return response.data === '' || response.data === undefined
      ? null
      : response.data;
  },

  get(path, params) {
    const clean = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== '',
          ),
        )
      : undefined;

    return Api.request(path, { method: 'GET', params: clean });
  },

  post: (path, body) => Api.request(path, { method: 'POST', body }),
  put: (path, body) => Api.request(path, { method: 'PUT', body }),
  patch: (path, body) => Api.request(path, { method: 'PATCH', body }),
  delete: (path) => Api.request(path, { method: 'DELETE' }),

  // ── Normalizadores de respuesta ──

  /**
   * Listas paginadas. Soporta:
   *  - BaseResource::collection → { data: [...], links, meta }
   *  - Paginador plano          → { current_page, data: [...], ... }
   */
  unwrapList(resp) {
    if (!resp) return { items: [], meta: null };
    if (Array.isArray(resp)) return { items: resp, meta: null };
    if (Array.isArray(resp.data)) {
      return {
        items: resp.data,
        meta: resp.meta || { current_page: resp.current_page || 1, total: resp.total || resp.data.length },
      };
    }
    if (Array.isArray(resp.items)) return { items: resp.items, meta: resp.meta || null };
    if (Array.isArray(resp.contactos)) return { items: resp.contactos, meta: null };
    return { items: [], meta: null };
  },

  /** Recurso único: { data: {...} } o {...} directo. */
  unwrapOne(resp) {
    if (!resp) return null;
    if (resp.data && !Array.isArray(resp.data) && typeof resp.data === 'object') return resp.data;
    if (resp.data && Array.isArray(resp.data)) return resp.data[0] || null;
    return resp;
  },

  /** Primer mensaje de validación 422 legible. */
  firstError(err) {
    if (err.errors && typeof err.errors === 'object') {
      const first = Object.values(err.errors)[0];
      if (Array.isArray(first)) return first[0];
      if (typeof first === 'string') return first;
    }
    return err.message;
  },

  /** Traduce mensajes del middleware de turno a algo accionable. */
  turnoMessage(err) {
    switch (err.code) {
      case 'FUERA_HORARIO':
        return 'Fuera del horario laboral (mañana 07:00-13:00, tarde 13:00-18:00, abierto 05:00-22:00).';
      case 'TURNO_INACTIVO':
        return 'No tienes un turno activo en este horario. Contacta al administrador.';
      case 'TURNO_EXPIRADO':
        return 'Tu turno ha expirado. Cierra la caja inmediatamente.';
      default:
        return err.message;
    }
  },
};
