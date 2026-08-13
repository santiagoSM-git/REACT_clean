import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../../hooks/useStyles';
import { useDashboardTheme } from '../../hooks/useDashboardTheme';
import { Auth } from '../../lib/auth';
import { Storage } from '../../lib/storage';
import { ProductosStore } from '../../lib/productos-store';
import { formatCurrency, showToast } from '../../lib/utils';

function obtenerProductosCliente() {
  return ProductosStore.obtenerTodos().map((p) => ({
    id: p.id,
    name: p.nombre,
    price: Number(p.precio) || 0,
    img: p.imagen,
    descripcion: p.descripcion || '',
  }));
}

function formatearPrecio(valor) {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^\d.-]/g, ''));
  return formatCurrency(Number.isNaN(n) ? 0 : n);
}

function obtenerMiUsername(u) {
  return u.username || u.nombre || 'Cliente';
}

function leerNotificaciones() {
  return JSON.parse(localStorage.getItem('kaffaNotificaciones')) || [];
}

function DashboardCliente() {
  useStyles(['dashboard-base.css', 'cliente.css']);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDashboardTheme();

  const [user, setUser] = useState(() => Auth.getCurrentUser());
  const [section, setSection] = useState('menu');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Productos
  const [cart, setCart] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentQty, setCurrentQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);

  // Carrito / pago
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [proofImageBase64, setProofImageBase64] = useState(null);

  // Pedidos y chat
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [now, setNow] = useState(Date.now());

  const prevUnread = useRef(0);
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileFileInputRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.nombre || 'Cliente',
    email: user?.email || '',
  });

  // ── Guard de autenticación ──
  useEffect(() => {
    if (!Auth.isLoggedIn() || !Auth.requireCliente()) {
      alert('⚠️ Debes iniciar sesión como cliente para acceder.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // ── Carga inicial ──
  useEffect(() => {
    const u = Auth.getCurrentUser() || { nombre: 'Cliente', role: 'cliente' };
    setUser(u);
  }, []);

  // ── Polling: historial de pedidos ──
  useEffect(() => {
    const loadHistory = () => {
      const all = Storage.getOrders();
      const myOrders = all.filter((o) => o.cliente === user.nombre).reverse();
      setOrders(myOrders);

      const notifs = leerNotificaciones();
      const misNotifs = notifs.filter((n) => n.cliente === user.nombre && !n.leida);
      if (misNotifs.length > 0) {
        misNotifs.forEach((n) => {
          const tipo = n.tipo === 'preparacion' ? 'info' : n.tipo === 'listo' ? 'success' : 'error';
          showToast(n.mensaje, tipo);
          n.leida = true;
        });
        localStorage.setItem('kaffaNotificaciones', JSON.stringify(notifs));
      }
    };

    loadHistory();
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Polling: chat ──
  useEffect(() => {
    const cargarChat = () => {
      const conv = Storage.getChat(obtenerMiUsername(user));
      const msgs = (conv && conv.messages) || [];
      setMessages(msgs);
      setUnreadChat((conv && conv.unreadCliente) || 0);
    };

    cargarChat();
    prevUnread.current = (Storage.getChat(obtenerMiUsername(user)) || {}).unreadCliente || 0;

    const chatPoll = setInterval(() => {
      const n = (Storage.getChat(obtenerMiUsername(user)) || {}).unreadCliente || 0;
      if (n > prevUnread.current) {
        const chatSec = document.getElementById('chat');
        if (!chatSec || !chatSec.classList.contains('active')) {
          showToast('💬 Nuevo mensaje del barista', 'info');
        }
      }
      prevUnread.current = n;
      cargarChat();
    }, 3000);

    return () => clearInterval(chatPoll);
  }, [user]);

  // ── Cronómetros ──
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar menú móvil y dropdown al navegar entre secciones
  useEffect(() => {
    setSidebarOpen(false);
    document.body.style.overflow = '';
    if (section === 'chat') {
      Storage.marcarChatLeido(obtenerMiUsername(user), 'cliente');
      const conv = Storage.getChat(obtenerMiUsername(user));
      setMessages((conv && conv.messages) || []);
      setUnreadChat(0);
    }
  }, [section, user]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.profile-trigger')) setDropdownOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Scroll del chat al final
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Acciones del modal de producto ──
  const openProductModal = (id) => {
    const p = obtenerProductosCliente().find((x) => x.id === id);
    setCurrentProduct(p);
    setCurrentQty(1);
    setNotes('');
    setShowProductModal(true);
  };

  const changeQty = (n) => {
    if (currentQty + n > 0) setCurrentQty((q) => q + n);
  };

  const addToCart = () => {
    if (!currentProduct) return;
    setCart((prev) => [...prev, { ...currentProduct, qty: currentQty, note: notes, total: currentProduct.price * currentQty }]);
    setShowProductModal(false);
    alert('Agregado al carrito');
  };

  const remCart = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const openPaymentModal = () => {
    if (cart.length === 0) {
      alert('Carrito vacío');
      return;
    }
    setShowCartModal(false);
    setPaymentMethod('cash');
    setProofImageBase64(null);
    setShowPaymentModal(true);
  };

  const handleProof = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setProofImageBase64(ev.target.result);
    r.readAsDataURL(file);
  };

  const finalizeOrder = () => {
    if (paymentMethod === 'transfer' && !proofImageBase64) {
      alert('Sube el comprobante.');
      return;
    }
    const total = cart.reduce((s, i) => s + i.total, 0);
    const order = {
      id: 'ORD-' + Date.now().toString().slice(-4),
      cliente: user.nombre,
      items: cart.map((i) => `${i.qty}x ${i.name}${i.note ? ' (' + i.note + ')' : ''}`),
      total,
      status: 'pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      metodoPago: paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
      comprobante: proofImageBase64,
    };

    const ordersList = Storage.getOrders();
    ordersList.push(order);
    Storage.setOrders(ordersList);

    setCart([]);
    setShowPaymentModal(false);
    alert('✅ Pedido Enviado!');
    setSection('pedidos');
  };

  const cancelarMiPedido = (id) => {
    if (!window.confirm('¿Seguro que deseas cancelar este pedido?')) return;
    const all = Storage.getOrders();
    const pedido = all.find((o) => o.id === id);
    if (!pedido || pedido.status !== 'pending') {
      alert('❌ Este pedido ya no puede ser cancelado porque está en preparación.');
      return;
    }
    Storage.setOrders(all.filter((o) => o.id !== id));
    alert('✅ Pedido cancelado correctamente.');
    setOrders(Storage.getOrders().filter((o) => o.cliente === user.nombre).reverse());
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    Storage.sendMessage(obtenerMiUsername(user), 'cliente', chatInput.trim());
    setChatInput('');
    const conv = Storage.getChat(obtenerMiUsername(user));
    setMessages((conv && conv.messages) || []);
  };

  const saveProfile = () => {
    const u = Auth.getCurrentUser() || {};
    u.nombre = profile.name;
    u.email = profile.email;
    Storage.setCurrentUser(u);
    setUser(u);
    setProfileOpen(false);
  };

  const logout = () => {
    if (window.confirm('¿Salir?')) {
      Auth.logout();
      navigate('/');
    }
  };

  // ── Render de pedidos ──
  const renderOrderStatus = (o) => {
    if (o.status === 'pending') {
      const expiresAt = (o.timestamp || Date.now()) + 3 * 60 * 1000;
      const active = now < expiresAt;
      return {
        icon: <i className="fa-solid fa-hourglass-half"></i>,
        texto: active ? 'En Solicitud' : 'Esperando Barista',
        color: '#f39c12',
        cancelable: active,
        countdown: active ? (
          <div className="client-countdown" style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', textAlign: 'center' }}>
            <i className="fa-solid fa-stopwatch"></i>{' '}
            Tienes {Math.floor((expiresAt - now) / 60000).toString().padStart(2, '0')}:
            {Math.floor(((expiresAt - now) % 60000) / 1000).toString().padStart(2, '0')} para cancelar
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px', textAlign: 'center' }}>
            Tiempo de cancelación agotado
          </div>
        ),
      };
    }
    if (o.status === 'prep') {
      return { icon: <i className="fa-solid fa-rotate"></i>, texto: 'En Preparación', color: '#3498db', cancelable: false, countdown: null };
    }
    if (o.status === 'entregado' || o.status === 'ready') {
      return { icon: <i className="fa-solid fa-circle-check"></i>, texto: 'Entregado', color: '#27ae60', cancelable: false, countdown: null };
    }
    return { icon: null, texto: o.status, color: '#f39c12', cancelable: false, countdown: null };
  };

  const cartTotal = cart.reduce((s, i) => s + i.total, 0);

  const profileAvatar =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nombre || 'C')}&background=293f2c&color=fff`;

  return (
    <div className="cliente-container">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} id="sidebarOverlay" onClick={() => setSidebarOpen(false)}></div>

      {/* SIDEBAR */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <img src="/imagenes/logo_kaffa.jpg" alt="KAFFA" className="sidebar-logo" />
          <div className="sidebar-header-text">
            <span className="sidebar-title">KAFFA</span>
            <span className="sidebar-subtitle">Cliente</span>
          </div>
        </div>
        <div className="sidebar-body">
          <nav className="sidebar-links">
            <a className={`sidebar-link${section === 'menu' ? ' active' : ''}`} onClick={() => setSection('menu')} id="link-menu">
              <i className="fa-solid fa-mug-hot"></i> Menú
            </a>
            <a className={`sidebar-link${section === 'pedidos' ? ' active' : ''}`} onClick={() => setSection('pedidos')} id="link-pedidos">
              <i className="fa-solid fa-list"></i> Mis Pedidos
            </a>
            <a className={`sidebar-link${section === 'chat' ? ' active' : ''}`} onClick={() => setSection('chat')} id="link-chat">
              <i className="fa-solid fa-comments"></i> Chat Barista{' '}
              {unreadChat > 0 && <span className="chat-unread-badge" id="chatUnread">{unreadChat}</span>}
            </a>
          </nav>
          <div className="sidebar-divider"></div>
          <nav className="sidebar-auth">
            <a className="sidebar-link" onClick={logout}>
              <i className="fa-solid fa-right-from-bracket"></i> Salir
            </a>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="header">
          <div className="menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>
            <i className="fa-solid fa-bars"></i>
          </div>
          <h2 className="page-title" id="pageTitle" style={{ fontSize: '18px' }}>
            {section === 'menu' ? 'Menú' : section === 'pedidos' ? 'Mis Pedidos' : 'Chat'}
          </h2>

          <div className="header-icons">
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <div className="cart-btn" onClick={() => setShowCartModal(true)}>
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-badge" id="cartBadge">{cart.length}</span>
            </div>
            <div className="profile-trigger" onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v); }}>
              <img src={profileAvatar} id="profileAvatar" className="profile-avatar" alt="Perfil" />
              <div className="profile-info" style={{ display: 'none' }}>
                <div className="profile-name" id="profileName">{user?.nombre || 'Cliente'}</div>
              </div>
              <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
              <div className={`profile-dropdown${dropdownOpen ? ' show' : ''}`} id="profileDropdown">
                <div className="dropdown-item" onClick={() => setProfileOpen(true)}>
                  <i className="fa-solid fa-user-pen"></i> Editar Perfil
                </div>
                <div className="dropdown-item logout" onClick={logout}>
                  <i className="fa-solid fa-right-from-bracket"></i> Salir
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          {/* MENÚ */}
          <div id="menu" className={`section${section === 'menu' ? ' active' : ''}`}>
            <div className="grid-products" id="productContainer">
              {obtenerProductosCliente().map((p) => (
                <div className="product-card" key={p.id} onClick={() => openProductModal(p.id)}>
                  <img src={p.img} alt={p.name} />
                  <h3>{p.name}</h3>
                  <p className="product-price">{formatearPrecio(p.price)}</p>
                  <button className="btn" style={{ marginTop: '5px' }}>
                    Ver
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PEDIDOS */}
          <div id="pedidos" className={`section${section === 'pedidos' ? ' active' : ''}`}>
            <h3 className="section-title">Tus Pedidos</h3>
            <div id="historyContainer">
              {orders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Sin pedidos. ¡Haz tu primer pedido!</p>
              ) : (
                orders.map((o) => {
                  const st = renderOrderStatus(o);
                  return (
                    <div
                      key={o.id}
                      style={{
                        background: 'var(--bg-card)',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '10px',
                        borderLeft: `4px solid ${st.color}`,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b>{o.id}</b>
                        <span style={{ background: st.color, color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                          {st.icon} {st.texto}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', margin: '10px 0', color: 'var(--text-light)' }}>
                        {(o.items || []).join(', ')}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-light)' }}>{o.metodoPago}</span>
                        <b style={{ color: 'var(--primary)' }}>{formatearPrecio(o.total)}</b>
                      </div>
                      {st.cancelable && (
                        <button
                          onClick={() => cancelarMiPedido(o.id)}
                          style={{
                            background: 'var(--danger)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginTop: '10px',
                            width: '100%',
                            fontWeight: '600',
                            fontFamily: 'inherit',
                          }}
                        >
                          <i className="fa-solid fa-ban"></i> Cancelar Pedido
                        </button>
                      )}
                      {st.countdown}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CHAT */}
          <div id="chat" className={`section${section === 'chat' ? ' active' : ''}`}>
            <div className="chat-layout">
              <div className="chat-header">
                <img src="https://ui-avatars.com/api/?name=Barista&background=293f2c&color=fff" alt="Soporte" />
                <div>
                  <div style={{ fontWeight: '600' }}>Soporte Kaffa</div>
                  <small style={{ opacity: 0.8 }}>En línea</small>
                </div>
              </div>
              <div className="chat-messages" id="chatMessages" ref={chatMessagesRef}>
                {messages.length === 0 && (
                  <div className="msg msg-barista">
                    <i className="fa-solid fa-hand-wave"></i> ¡Hola! ¿En qué te puedo ayudar hoy?
                  </div>
                )}
                {messages.map((m, i) => (
                  <div className={`msg ${m.from === 'cliente' ? 'msg-user' : 'msg-barista'}`} key={i}>
                    {m.text}
                    <div className="meta">
                      {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  id="chatInput"
                  placeholder="Escribe..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="chat-send-btn" onClick={sendMessage}>
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DETALLE PRODUCTO */}
      {showProductModal && currentProduct && (
        <div className="modal-overlay" style={{ display: 'flex' }} id="modalProduct">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowProductModal(false)}>&times;</button>
            <img src={currentProduct.img} alt={currentProduct.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
            <h2>{currentProduct.name}</h2>
            <p id="detailPrice" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.2rem' }}>
              {formatearPrecio(currentProduct.price)}
            </p>
            <div style={{ display: 'flex', gap: '10px', margin: '15px 0', alignItems: 'center', justifyContent: 'center' }}>
              <button className="btn-icon" onClick={() => changeQty(-1)} style={{ fontSize: '1.2rem', padding: '4px 12px' }}>
                <i className="fa-solid fa-minus"></i>
              </button>
              <span id="detailQty" style={{ fontWeight: '700', fontSize: '1.2rem' }}>{currentQty}</span>
              <button className="btn-icon" onClick={() => changeQty(1)} style={{ fontSize: '1.2rem', padding: '4px 12px' }}>
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            <textarea
              id="detailNotes"
              className="form-group"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'inherit' }}
              placeholder="Notas (ej. sin azúcar)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
            <button className="btn-primary" onClick={addToCart} style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-cart-plus"></i> Agregar al Carrito
            </button>
          </div>
        </div>
      )}

      {/* MODAL CARRITO */}
      {showCartModal && (
        <div className="modal-overlay" style={{ display: 'flex' }} id="modalCart">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowCartModal(false)}>&times;</button>
            <h2>
              <i className="fa-solid fa-cart-shopping"></i> Tu Carrito
            </h2>
            <div id="cartItemsContainer" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center' }}>Vacío</p>
              ) : (
                cart.map((i, x) => (
                  <div className="cart-item" key={x}>
                    <div>
                      <b>{i.name}</b> x{i.qty}
                      <br />
                      <small>{i.note}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {formatearPrecio(i.total)}{' '}
                      <i className="fa-solid fa-trash" style={{ color: 'red', cursor: 'pointer' }} onClick={() => remCart(x)}></i>
                    </div>
                  </div>
                ))
              )}
            </div>
            <h3 style={{ textAlign: 'right' }}>
              Total: <span id="cartTotalAmount" style={{ color: 'var(--primary)' }}>{formatearPrecio(cartTotal)}</span>
            </h3>
            <button className="btn-primary" onClick={openPaymentModal} style={{ marginTop: '15px', width: '100%', justifyContent: 'center', background: 'var(--success, #27ae60)' }}>
              <i className="fa-solid fa-check"></i> Confirmar Compra
            </button>
          </div>
        </div>
      )}

      {/* MODAL PAGO */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ display: 'flex' }} id="modalPayment">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>&times;</button>
            <h2>
              <i className="fa-solid fa-credit-card"></i> Método de Pago
            </h2>

            <div className="payment-options">
              <div
                className={`payment-opt${paymentMethod === 'cash' ? ' selected' : ''}`}
                id="payCash"
                onClick={() => setPaymentMethod('cash')}
              >
                <i className="fa-solid fa-money-bill"></i> Efectivo
              </div>
              <div
                className={`payment-opt${paymentMethod === 'transfer' ? ' selected' : ''}`}
                id="payTransfer"
                onClick={() => setPaymentMethod('transfer')}
              >
                <i className="fa-solid fa-mobile-screen"></i> Transferencia
              </div>
            </div>

            {paymentMethod === 'transfer' && (
              <div id="transferArea" style={{ display: 'block', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <b>Nequi/Daviplata:</b> 300 123 4567
                </p>
                <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '24px', color: 'var(--text-muted)' }}></i>
                  <p style={{ fontSize: '12px', margin: '5px 0 0', color: 'var(--text-muted)' }}>Subir Comprobante</p>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleProof} />
                </div>
                {proofImageBase64 && <img src={proofImageBase64} id="proofPreview" className="preview-img" alt="Comprobante" />}
              </div>
            )}

            <button className="btn-primary" onClick={finalizeOrder} style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-check"></i> Finalizar Pedido
            </button>
          </div>
        </div>
      )}

      {/* MODAL PERFIL */}
      {profileOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }} id="modalProfile">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setProfileOpen(false)}>&times;</button>
            <h2>
              <i className="fa-solid fa-user-gear"></i> Mi Perfil
            </h2>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <img src={profileAvatar} className="profile-modal-avatar" alt="Perfil" />
              <br />
              <button
                className="btn-icon"
                onClick={() => profileFileInputRef.current?.click()}
                style={{ marginTop: '6px' }}
              >
                <i className="fa-solid fa-camera"></i> Cambiar Foto
              </button>
              <input
                type="file"
                ref={profileFileInputRef}
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files[0]) {
                    const r = new FileReader();
                    r.onload = (ev) => {
                      setProfile((p) => ({ ...p, avatar: ev.target.result }));
                    };
                    r.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-palette"></i> Tema
              </label>
              <select value={theme} onChange={(e) => {
                localStorage.setItem('kaffaTheme', e.target.value);
                window.location.reload();
              }}>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setProfileOpen(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={saveProfile}>
                <i className="fa-solid fa-floppy-disk"></i> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardCliente;
