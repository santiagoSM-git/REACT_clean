/**
 * KAFFA - Módulo de Autenticación
 * Manejo centralizado de login, logout y verificaciones (portado desde js/auth.js)
 */
import { Storage } from './storage';

export const Auth = {
  // Credenciales de administrador (demo)
  ADMIN_CREDENTIALS: {
    username: 'admin',
    password: 'admin123',
  },

  // ── Verificaciones de estado ──
  isLoggedIn() {
    const user = Storage.getCurrentUser();
    return user && Object.keys(user).length > 0;
  },

  getCurrentUser() {
    return Storage.getCurrentUser();
  },

  getRole() {
    const user = Auth.getCurrentUser();
    return user?.role || null;
  },

  isAdmin() {
    return Auth.getRole() === 'admin';
  },
  isBarista() {
    return Auth.getRole() === 'barista';
  },
  isCliente() {
    return Auth.getRole() === 'cliente';
  },

  // ── Autenticación ──
  login(username, password) {
    // 1. Administrador
    if (
      username === Auth.ADMIN_CREDENTIALS.username &&
      password === Auth.ADMIN_CREDENTIALS.password
    ) {
      const user = { username, role: 'admin' };
      Storage.setCurrentUser(user);
      return {
        success: true,
        user,
        role: 'admin',
        redirect: '/admin-dashboard',
        message: '✅ Bienvenido al panel de administración!',
      };
    }

    // 2. Barista
    const baristas = Storage.getBaristas();
    const barista = baristas.find(
      (b) =>
        (b.usuario === username || b.username === username) &&
        (b.pass === password || b.password === password),
    );
    if (barista) {
      const user = {
        username: barista.usuario || barista.username,
        nombre: barista.nombre,
        role: 'barista',
      };
      Storage.setCurrentUser(user);
      return {
        success: true,
        user,
        role: 'barista',
        redirect: '/barista-dashboard',
        message: `✅ Hola ${barista.nombre}! Turno iniciado.`,
      };
    }

    // 3. Cliente
    const usuario = Storage.findUsuario(username);
    if (usuario && usuario.password === password) {
      const user = {
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        role: 'cliente',
      };
      Storage.setCurrentUser(user);
      Storage.set(Storage.KEYS.CLIENTE, true);
      return {
        success: true,
        user,
        role: 'cliente',
        redirect: '/cliente-dashboard',
        message: `✅ Bienvenido ${usuario.nombre || usuario.username}! Disfruta tu café ☕`,
      };
    }

    // 4. Credenciales inválidas
    return {
      success: false,
      user: null,
      role: null,
      redirect: null,
      message: '❌ Usuario o contraseña incorrectos. Por favor verifica tus datos.',
    };
  },

  logout(redirectTo = null) {
    Storage.clearSession();
    return redirectTo || '/';
  },

  // ── Registro ──
  register(data) {
    const { nombre, username, email, password } = data;
    const usuarios = Storage.getUsuarios();

    if (usuarios.find((u) => u.username === username)) {
      return {
        success: false,
        message: '❌ Este nombre de usuario ya está en uso. Por favor elige otro.',
      };
    }
    if (usuarios.find((u) => u.email === email)) {
      return {
        success: false,
        message: '❌ Este correo electrónico ya está registrado.',
      };
    }

    const nuevoUsuario = {
      nombre,
      username,
      email,
      password,
      role: 'cliente',
      fechaRegistro: new Date().toISOString(),
    };
    Storage.addUsuario(nuevoUsuario);

    return { success: true, message: '✅ ¡Registro exitoso! Ahora puedes iniciar sesión.' };
  },

  // ── Protección de rutas ──
  requireAuth(requiredRole = null) {
    if (!Auth.isLoggedIn()) return false;
    if (requiredRole && Auth.getRole() !== requiredRole) return false;
    return true;
  },
  requireCliente() {
    return Boolean(Storage.get(Storage.KEYS.CLIENTE));
  },
};
