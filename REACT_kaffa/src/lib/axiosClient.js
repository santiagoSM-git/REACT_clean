/**
 * KAFFA - Cliente HTTP centralizado sobre Axios.
 * Base relativa '/api/v1' (Vite proxea a http://localhost:8000 en dev;
 * en producción con Apache, el mismo host resuelve /api/v1).
 *
 * Aquí viven el token Sanctum, los headers por defecto y la traducción de
 * errores de Axios al contrato ApiError que ya consume toda la aplicación.
 */
import axios from 'axios';
import { ApiError } from './apiError';

// Permite apuntar a otro origen sin cambiar código: VITE_API_URL=http://...
export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kaffaToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FormData debe llevar su Content-Type con boundary, no application/json.
  if (config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      if (axios.isCancel(error)) {
        return Promise.reject(new ApiError(0, 'Solicitud cancelada.'));
      }
      return Promise.reject(
        new ApiError(0, `No se pudo conectar con el servidor (${API_BASE}).`),
      );
    }

    const { status, data } = error.response;
    const message =
      typeof data === 'string' && data.trim()
        ? data
        : data?.message || data?.error || error.message || `Error ${status}`;

    // Sesión inválida → limpiar y avisar a la UI (Navbar/Layout escuchan
    // 'kaffa-auth-change') para que vuelva al estado invitado.
    if (status === 401) {
      localStorage.removeItem('kaffaToken');
      localStorage.removeItem('kaffaUser');
      window.dispatchEvent(new Event('kaffa-auth-change'));
    }

    return Promise.reject(
      new ApiError(
        status,
        message,
        data?.errors ?? null,
        data?.code ?? null,
      ),
    );
  },
);

export default apiClient;
