/**
 * KAFFA - Cliente HTTP de la API Laravel (React)
 * Base relativa '/api/v1' (Vite proxea a http://localhost:8000 en dev;
 * en producción con Apache, el mismo host resuelve /api/v1).
 * Maneja token Sanctum, formatos de respuesta y errores estandarizados.
 */

// Cambia aquí si el backend vive en otro origen (ej. 'http://localhost:8000/api/v1')
export const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(status, message, errors = null, code = null) {
    super(message || `Error ${status}`);
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

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
    const url = path.startsWith('http') ? path : Api.BASE + path;
    const headers = { Accept: 'application/json', ...(options.headers || {}) };

    const body = options.body;
    if (body instanceof FormData) {
      options.body = body;
    } else if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const token = Api.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    let resp;
    try {
      resp = await fetch(url, { ...options, headers });
    } catch {
      throw new ApiError(0, `No se pudo conectar con el servidor (${Api.BASE}).`);
    }

    let data = null;
    const text = await resp.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!resp.ok) {
      const err = new ApiError(
        resp.status,
        (data && (data.message || data.error)) || `Error ${resp.status}`,
        (data && data.errors) || null,
        (data && data.code) || null,
      );

      // Sesión inválida → limpiar (el guard de rutas redirige a /login)
      if (resp.status === 401 && !options._retryLogin) {
        Api.clearToken();
        localStorage.removeItem('kaffaUser');
      }
      throw err;
    }

    return data;
  },

  get: (path, params) => {
    let url = path;
    if (params && Object.keys(params).length) {
      const qs = new URLSearchParams();
      Object.keys(params).forEach((k) => {
        const v = params[k];
        if (v !== undefined && v !== null && v !== '') qs.append(k, v);
      });
      const s = qs.toString();
      if (s) url += (url.includes('?') ? '&' : '?') + s;
    }
    return Api.request(url, { method: 'GET' });
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
        return 'Fuera del horario laboral (07:00 - 18:00).';
      case 'TURNO_INACTIVO':
        return 'No tienes un turno activo en este horario. Contacta al administrador.';
      case 'TURNO_EXPIRADO':
        return 'Tu turno ha expirado. Cierra la caja inmediatamente.';
      default:
        return err.message;
    }
  },
};
