/**
 * KAFFA - Wrapper para LocalStorage
 * Centraliza todas las operaciones de almacenamiento (portado desde js/storage.js)
 */

export const Storage = {
  // ── Claves de storage ──
  KEYS: {
    USER: 'kaffaUser',
    CLIENTE: 'kaffaCliente',
    USUARIOS: 'usuariosApp',
    BARISTAS: 'listaBaristas',
    PRODUCTOS: 'inventarioProductos',
    CARRITO: 'kaffaCarrito',
    PEDIDOS: 'kaffaPedidos',
    CHATS: 'kaffaChats',
    REPORTES: 'kaffaReportesCaja',
    ADMIN_AVATAR: 'adminAvatar',
    ADMIN_TEMA: 'adminTema',
  },

  // ── Operaciones básicas ──
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error leyendo ${key}:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error guardando ${key}:`, e);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },

  // ── Usuarios ──
  getUsuarios() {
    return Storage.get(Storage.KEYS.USUARIOS, []);
  },
  setUsuarios(usuarios) {
    Storage.set(Storage.KEYS.USUARIOS, usuarios);
  },
  addUsuario(usuario) {
    const usuarios = Storage.getUsuarios();
    usuarios.push(usuario);
    Storage.setUsuarios(usuarios);
  },
  findUsuario(identifier) {
    return Storage.getUsuarios().find((u) => u.username === identifier || u.email === identifier) || null;
  },

  // ── Baristas ──
  getBaristas() {
    return Storage.get(Storage.KEYS.BARISTAS, []);
  },
  setBaristas(baristas) {
    Storage.set(Storage.KEYS.BARISTAS, baristas);
  },
  addBarista(barista) {
    const baristas = Storage.getBaristas();
    baristas.push(barista);
    Storage.setBaristas(baristas);
  },
  findBarista(username) {
    return Storage.getBaristas().find((b) => b.usuario === username || b.username === username) || null;
  },
  removeBarista(id) {
    Storage.setBaristas(Storage.getBaristas().filter((b) => b.id !== id));
  },

  // ── Carrito ──
  getCarrito() {
    return Storage.get(Storage.KEYS.CARRITO, []);
  },
  setCarrito(carrito) {
    Storage.set(Storage.KEYS.CARRITO, carrito);
  },
  clearCarrito() {
    Storage.set(Storage.KEYS.CARRITO, []);
  },
  addToCarrito(item) {
    const carrito = Storage.getCarrito();
    carrito.push(item);
    Storage.setCarrito(carrito);
  },
  removeFromCarrito(itemId) {
    Storage.setCarrito(Storage.getCarrito().filter((item) => item.id !== itemId));
  },

  // ── Pedidos (tiempo real compartido cliente/barista/admin) ──
  getPedidos() {
    return Storage.get(Storage.KEYS.PEDIDOS, []);
  },
  setPedidos(pedidos) {
    Storage.set(Storage.KEYS.PEDIDOS, pedidos);
  },
  getOrders() {
    return Storage.get('kaffaOrders', []);
  },
  setOrders(orders) {
    Storage.set('kaffaOrders', orders);
  },
  addPedido(pedido) {
    const pedidos = Storage.getPedidos();
    pedidos.push(pedido);
    Storage.setPedidos(pedidos);
  },
  getPedidosByCliente(username) {
    return Storage.getPedidos().filter((p) => p.cliente === username);
  },

  // ── Chat ──
  getChats() {
    return Storage.get(Storage.KEYS.CHATS, []);
  },
  setChats(chats) {
    Storage.set(Storage.KEYS.CHATS, chats);
  },
  getChat(username) {
    return Storage.getChats().find((c) => c.username === username) || null;
  },
  sendMessage(username, from, text) {
    const chats = Storage.getChats();
    let conv = chats.find((c) => c.username === username);
    if (!conv) {
      conv = { username, cliente: username, messages: [], unreadBarista: 0, unreadCliente: 0 };
      chats.push(conv);
    }
    conv.messages.push({ from, text, ts: Date.now() });
    if (from === 'cliente') conv.unreadBarista = (conv.unreadBarista || 0) + 1;
    else conv.unreadCliente = (conv.unreadCliente || 0) + 1;
    conv.lastMessage = conv.messages[conv.messages.length - 1];
    Storage.setChats(chats);
    return conv;
  },
  marcarChatLeido(username, lado) {
    const chats = Storage.getChats();
    const conv = chats.find((c) => c.username === username);
    if (conv) {
      if (lado === 'barista') conv.unreadBarista = 0;
      if (lado === 'cliente') conv.unreadCliente = 0;
      Storage.setChats(chats);
    }
  },
  totalChatsNoLeidos(lado) {
    return Storage.getChats().reduce(
      (sum, c) => sum + (lado === 'barista' ? c.unreadBarista || 0 : c.unreadCliente || 0),
      0,
    );
  },

  // ── Reportes (barista -> admin) ──
  getReportes() {
    return Storage.get(Storage.KEYS.REPORTES, []);
  },
  setReportes(reportes) {
    Storage.set(Storage.KEYS.REPORTES, reportes);
  },
  addReporte(data) {
    const reporte = {
      id: Date.now(),
      barista: data.barista,
      mensaje: data.mensaje,
      prioridad: data.prioridad,
      fecha: new Date().toISOString(),
    };
    const reportes = Storage.getReportes();
    reportes.push(reporte);
    Storage.setReportes(reportes);
    return reporte;
  },

  // ── Sesión ──
  getCurrentUser() {
    return Storage.get(Storage.KEYS.USER, {});
  },
  setCurrentUser(user) {
    Storage.set(Storage.KEYS.USER, user);
  },
  clearSession() {
    Storage.remove(Storage.KEYS.USER);
    Storage.remove(Storage.KEYS.CLIENTE);
  },
};
