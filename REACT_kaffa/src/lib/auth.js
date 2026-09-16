/**
 * KAFFA - Módulo de Autenticación (API Laravel Sanctum)
 * Login/registro reales contra /api/v1. Roles desde usuario.roles.
 */
import { Api } from './api';

/** Notifica a la UI (Navbar, etc.) que cambió la sesión. */
function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('kaffa-auth-change'));
  }
}

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

  /**
   * Redirección tras iniciar sesión.
   * El cliente NO se va a otro menú: se queda en el home público con sus
   * funciones habilitadas (estilo Rappi / MercadoLibre / Juan Valdez).
   */
  redirectFor(rol) {
    if (rol === 'admin') return '/admin-dashboard';
    if (rol === 'barista') return '/barista-dashboard';
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
      notifyAuthChange();

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
      // Correo no verificado: se señaliza para que la UI ofrezca reenviar el correo.
      if (err.status === 403 && err.code === 'EMAIL_NOT_VERIFIED') {
        return { success: false, notVerified: true, correo, message: '⚠️ Debes verificar tu correo antes de entrar.' };
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
   * POST /registro (crea usuario rol cliente).
   * La cuenta queda pendiente de verificación de correo: el backend ya no
   * devuelve token, el usuario debe verificar su correo antes de entrar.
   */
  async register(data) {
    try {
      const resp = await Api.post('/registro', data);
      return {
        success: true,
        correo: resp.correo || data.correo,
        message: resp.message || '✅ ¡Registro exitoso! Revisa tu correo.',
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
    localStorage.removeItem('kaffaCarrito');
    notifyAuthChange();
  },

  // ── Recuperación de contraseña y verificación de correo ──

  /** POST /forgot-password: solicita el enlace de restablecimiento. */
  async forgotPassword(correo) {
    try {
      const resp = await Api.post('/forgot-password', { correo });
      return { success: true, message: resp.message };
    } catch (err) {
      return { success: false, message: Api.firstError(err) };
    }
  },

  /** POST /reset-password: guarda la nueva contraseña con el token del correo. */
  async resetPassword(data) {
    try {
      const resp = await Api.post('/reset-password', data);
      return { success: true, message: resp.message };
    } catch (err) {
      return { success: false, message: Api.firstError(err) };
    }
  },

  /** POST /email/verification-notification: reenvía el correo de verificación. */
  async resendVerification(correo) {
    try {
      const resp = await Api.post('/email/verification-notification', { correo });
      return { success: true, message: resp.message };
    } catch (err) {
      return { success: false, message: Api.firstError(err) };
    }
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
      notifyAuthChange();
      if (requiredRole && !Auth.hasRole(requiredRole)) return null;
      return user;
    } catch {
      return null;
    }
  },
};
