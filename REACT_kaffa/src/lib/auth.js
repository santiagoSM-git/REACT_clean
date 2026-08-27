/**
 * KAFFA - Módulo de Autenticación (API Laravel Sanctum)
 * Login/registro reales contra /api/v1. Roles desde usuario.roles.
 */
import { Api } from './api';

export const Auth = {
  // ── Estado ──

  isLoggedIn() {
    return !!Api.getToken();
  },

  getCurrentUser() {
    return Api.getUser();
  },

  /** Rol principal (primer rol asignado por el backend). */
  getRole() {
    const user = Auth.getCurrentUser();
    if (!user) return null;
    const roles = user.roles || [];
    if (roles.length && roles[0].nombre) return roles[0].nombre;
    return user.primary_role || null;
  },

  hasRole(rol) {
    const user = Auth.getCurrentUser();
    return !!(user && (user.roles || []).some((r) => r.nombre === rol));
  },

  isAdmin: () => Auth.hasRole('admin'),
  isBarista: () => Auth.hasRole('barista'),
  isCliente: () => Auth.hasRole('cliente'),

  // ── Redirección según rol ──

  redirectFor(rol) {
    if (rol === 'admin') return '/admin-dashboard';
    if (rol === 'barista') return '/barista-dashboard';
    if (rol === 'cliente') return '/cliente-dashboard';
    return '/';
  },

  // ── Autenticación ──

  /**
   * POST /login con correo y password.
   * @returns {Promise<Object>} { success, role, redirect, message }
   */
  async login(correo, password) {
    try {
      const resp = await Api.post('/login', { correo, password });
      Api.setToken(resp.access_token);
      Api.setUser(resp.usuario);

      const role = resp.usuario.roles && resp.usuario.roles[0] ? resp.usuario.roles[0].nombre : null;

      return {
        success: true,
        role,
        redirect: Auth.redirectFor(role),
        message: `✅ Bienvenido ${resp.usuario.nombre || ''}`,
        turno_activo: resp.turno_activo,
        turno_info: resp.turno_info,
      };
    } catch (err) {
      if (err.status === 401) {
        return { success: false, message: '❌ Credenciales inválidas. Verifica correo y contraseña.' };
      }
      if (err.status === 403) {
        return { success: false, message: `❌ ${err.message || 'Acceso denegado.'}` };
      }
      if (err.status === 429) {
        return { success: false, message: '⏳ Demasiados intentos. Espera un minuto.' };
      }
      return { success: false, message: `❌ ${err.message}` };
    }
  },

  /**
   * POST /registro (crea usuario rol cliente y auto-inicia sesión).
   */
  async register(data) {
    try {
      const resp = await Api.post('/registro', data);
      Api.setToken(resp.access_token);
      Api.setUser(resp.usuario);
      return {
        success: true,
        role: 'cliente',
        redirect: '/cliente-dashboard',
        message: '✅ ¡Registro exitoso! Bienvenido a KAFFA.',
      };
    } catch (err) {
      return { success: false, message: `❌ ${Api.firstError(err)}` };
    }
  },

  /** POST /logout + limpieza local. */
  async logout() {
    try {
      await Api.post('/logout');
    } catch {
      /* token ya inválido */
    }
    Api.clearToken();
    localStorage.removeItem('kaffaUser');
  },

  // ── Protección de páginas ──

  /**
   * Valida la sesión contra GET /me y exige rol si se indica.
   * @returns {Promise<Object|null>} usuario válido o null
   */
  async requireAuth(requiredRole = null) {
    if (!Api.getToken()) return null;

    try {
      const user = await Api.get('/me');
      Api.setUser(user);
      if (requiredRole && !Auth.hasRole(requiredRole)) return null;
      return user;
    } catch {
      return null;
    }
  },
};
