import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../../hooks/useStyles';
import { useDashboardTheme } from '../../hooks/useDashboardTheme';
import { Auth } from '../../lib/auth';
import { Api } from '../../lib/api';

const ESTADOS_CLIENTE = {
  pendiente: { label: 'Pendiente', color: '#f39c12', icon: <i className="fa-solid fa-hourglass-half"></i> },
  pagado: { label: 'Pagado · En preparación', color: '#3498db', icon: <i className="fa-solid fa-rotate"></i> },
  cancelado: { label: 'Cancelado', color: '#e74c3c', icon: <i className="fa-solid fa-ban"></i> },
  entregado: { label: 'Entregado', color: '#27ae60', icon: <i className="fa-solid fa-circle-check"></i> },
};

function money(v) {
  const n = Number(v) || 0;
  return '$' + n.toLocaleString('es-CO');
}

function DashboardCliente() {
  useStyles(['dashboard-base.css', 'cliente.css']);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDashboardTheme();

  const [user, setUser] = useState(() => Auth.getCurrentUser());
  const [section, setSection] = useState('menu');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Catálogo
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [medios, setMedios] = useState([]);

  // Detalle de producto
  const [currentProduct, setCurrentProduct] = useState(null);

  // Carrito + pago
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMedioId, setPaymentMedioId] = useState('');
  const [payOnline, setPayOnline] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Pedidos y chat
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatContacto, setChatContacto] = useState(null);

  const chatMessagesRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', password: '', avatar: null });
  const [savingProfile, setSavingProfile] = useState(false);
  const profileFileInputRef = useRef(null);

  // ── Catálogo ──
  useEffect(() => {
    Promise.all([Api.get('/productos', { per_page: 100, activo: 1 }), Api.get('/categorias', { per_page: 100 }), Api.get('/medios-pago', { per_page: 100 })])
      .then(([pResp, cResp, mResp]) => {
        setProductos(Api.unwrapList(pResp).items);
        setCategorias(Api.unwrapList(cResp).items);
        setMedios(Api.unwrapList(mResp).items);
      })
      .catch(() => {});
  }, []);

  // ── Mis pedidos (scope por cliente en el backend) ──
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const resp = await Api.get('/pedidos', { per_page: 50 });
        setOrders(Api.unwrapList(resp).items);
      } catch {
        /* sin token aún */
      }
    };
    loadHistory();
    const interval = setInterval(loadHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Chat ──
  useEffect(() => {
    const cargarContacto = async () => {
      try {
        const resp = await Api.get('/mensajes/contactos');
        if (Array.isArray(resp) && resp.length) setChatContacto(resp[0]);
      } catch {
        /* noop */
      }
    };
    cargarContacto();
  }, []);

  useEffect(() => {
    const cargarChat = async () => {
      try {
        const resp = await Api.get('/mensajes');
        const n = (resp.contactos || []).reduce((s, c) => s + (c.no_leidos || 0), 0);
        setUnreadChat(n);
      } catch {
        /* noop */
      }

      if (chatContacto) {
        try {
          const resp = await Api.get('/mensajes', { con: chatContacto.id });
          setMessages(Api.unwrapList(resp.mensajes).items.slice().reverse());
          if (section === 'chat') await Api.post('/mensajes/leer', { con: chatContacto.id });
        } catch {
          /* noop */
        }
      }
    };
    cargarChat();
    const interval = setInterval(cargarChat, 5000);
    return () => clearInterval(interval);
  }, [chatContacto, section]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.profile-trigger')) setDropdownOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const filtrarCategoria = (id) => {
    setCategoriaActiva(id);
  };

  const listaProductos = categoriaActiva === null ? productos : productos.filter((p) => p.categoria_id == categoriaActiva);

  // ── Carrito / pago ──
  const addToCart = () => {
    if (!currentProduct) return;
    setCart((prev) => [...prev, { ...currentProduct, qty: 1, total: Number(currentProduct.precio_venta) || 0 }]);
    setCurrentProduct(null);
  };

  const remCart = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const openPaymentModal = () => {
    if (cart.length === 0) return alert('Carrito vacío');
    setShowCartModal(false);
    setPayOnline(false);
    setPaymentMedioId(medios.find((m) => !m.es_virtual)?.id || medios[0]?.id || '');
    setComprobanteUrl('');
    setShowPaymentModal(true);
  };

  const medioSeleccionado = medios.find((m) => m.id == paymentMedioId);
  const requiereComprobante = payOnline && medioSeleccionado?.es_virtual;

  const finalizeOrder = async () => {
    if (requiereComprobante && !comprobanteUrl.trim()) return alert('Sube el comprobante (URL) para pagos virtuales.');

    const detalles = cart.map((i) => ({
      producto_id: i.id,
      cantidad: i.qty,
      precio_unitario: Number(i.precio_venta) || 0,
      subtotal: (Number(i.precio_venta) || 0) * i.qty,
    }));
    const total = cart.reduce((s, i) => s + (Number(i.precio_venta) || 0) * i.qty, 0);

    const body = { estado: 'pendiente', total, detalles, pagos: [] };
    if (payOnline && paymentMedioId) {
      const pago = { medio_pago_id: Number(paymentMedioId), monto: total };
      if (comprobanteUrl.trim()) pago.comprobante_url = comprobanteUrl.trim();
      body.pagos = [pago];
    }

    setEnviando(true);
    try {
      await Api.post('/pedidos', body);
      setCart([]);
      setShowPaymentModal(false);
      alert('✅ Pedido enviado al barista. Pasa a pagar/recoger en mostrador. ☕');
      setSection('pedidos');
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setEnviando(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!chatContacto) return alert('No hay personal disponible en este momento.');
    try {
      await Api.post('/mensajes', { destinatario_id: chatContacto.id, mensaje: chatInput.trim() });
      setChatInput('');
      const resp = await Api.get('/mensajes', { con: chatContacto.id });
      setMessages(Api.unwrapList(resp.mensajes).items.slice().reverse());
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  // ── Perfil ──
  const openProfile = () => {
    const u = Auth.getCurrentUser() || {};
    setProfile({ name: u.nombre || '', email: u.correo || '', password: '', avatar: u.avatar || null });
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    const u = Auth.getCurrentUser() || {};
    const body = { nombre: profile.name.trim(), correo: profile.email.trim() };
    if (profile.password) body.password = profile.password;
    if (!body.nombre || !body.correo) return alert('Nombre y correo requeridos');

    setSavingProfile(true);
    try {
      const actualizado = await Api.put('/perfil', body);
      const next = { ...u, ...actualizado, avatar: profile.avatar || u.avatar };
      Api.setUser(next);
      setUser(next);
      setProfileOpen(false);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = async () => {
    if (window.confirm('¿Salir?')) {
      await Auth.logout();
      navigate('/login');
    }
  };

  const cartTotal = cart.reduce((s, i) => s + (Number(i.precio_venta) || 0) * i.qty, 0);

  const profileAvatar =
    profile.avatar ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nombre || 'C')}&background=293f2c&color=fff`;

  return (
    <div className="cliente-container">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* SIDEBAR */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <img src="/imagenes/logo_kaffa.jpg" alt="KAFFA" className="sidebar-logo" />
          <div className="sidebar-header-text">
            <span className="sidebar-title">KAFFA</span>
            <span className="sidebar-subtitle">Cliente</span>
          </div>
        </div>
        <div className="sidebar-body">
          <nav className="sidebar-links">
            <a className={`sidebar-link${section === 'menu' ? ' active' : ''}`} onClick={() => setSection('menu')}>
              <i className="fa-solid fa-mug-hot"></i> Menú
            </a>
            <a className={`sidebar-link${section === 'pedidos' ? ' active' : ''}`} onClick={() => setSection('pedidos')}>
              <i className="fa-solid fa-list"></i> Mis Pedidos
            </a>
            <a className={`sidebar-link${section === 'chat' ? ' active' : ''}`} onClick={() => setSection('chat')}>
              <i className="fa-solid fa-comments"></i> Chat Barista{' '}
              {unreadChat > 0 && <span className="chat-unread-badge">{unreadChat}</span>}
            </a>
          </nav>
          <div className="sidebar-divider"></div>
          <nav className="sidebar-auth">
            <a className="sidebar-link" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i> Salir</a>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="header">
          <div className="menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>
            <i className="fa-solid fa-bars"></i>
          </div>
          <h2 className="page-title" style={{ fontSize: '18px' }}>
            {section === 'menu' ? 'Menú' : section === 'pedidos' ? 'Mis Pedidos' : 'Chat'}
          </h2>

          <div className="header-icons">
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <div className="cart-btn" onClick={() => setShowCartModal(true)}>
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-badge">{cart.length}</span>
            </div>
            <div className="profile-trigger" onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v); }}>
              <img src={profileAvatar} className="profile-avatar" alt="Perfil" />
              <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
              <div className={`profile-dropdown${dropdownOpen ? ' show' : ''}`}>
                <div className="dropdown-item" onClick={openProfile}><i className="fa-solid fa-user-pen"></i> Editar Perfil</div>
                <div className="dropdown-item logout" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i> Salir</div>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          {/* MENÚ */}
          <div className={`section${section === 'menu' ? ' active' : ''}`}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <button className={`btn ${categoriaActiva === null ? 'btn-primary' : 'btn-secondary'}`} onClick={() => filtrarCategoria(null)} style={{ padding: '6px 14px', fontSize: '13px' }}>
                Todos
              </button>
              {categorias.map((c) => (
                <button key={c.id} className={`btn ${categoriaActiva == c.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => filtrarCategoria(c.id)} style={{ padding: '6px 14px', fontSize: '13px' }}>
                  {c.nombre}
                </button>
              ))}
            </div>
            <div className="grid-products">
              {listaProductos.map((p) => (
                <div className="product-card" key={p.id} onClick={() => setCurrentProduct(p)}>
                  <img
                    src={p.imagen || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'}
                    alt={p.nombre}
                    onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400')}
                  />
                  <h3>{p.nombre}</h3>
                  <p className="product-price">{money(p.precio_venta)}</p>
                  <button className="btn" style={{ marginTop: '5px' }}>Agregar</button>
                </div>
              ))}
              {listaProductos.length === 0 && <p className="text-muted" style={{ textAlign: 'center', width: '100%', padding: '20px' }}>Sin productos en esta categoría.</p>}
            </div>
          </div>

          {/* PEDIDOS */}
          <div className={`section${section === 'pedidos' ? ' active' : ''}`}>
            <h3 className="section-title">Tus Pedidos</h3>
            {orders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Sin pedidos todavía. ¡Arma tu carrito y ordena! ☕</p>
            ) : (
              orders.map((o) => {
                const st = ESTADOS_CLIENTE[o.estado] || ESTADOS_CLIENTE.pendiente;
                const items = (o.detalles || []).map((d) => (Number(d.cantidad) || 1) + 'x ' + (d.producto?.nombre || '—')).join(', ');
                const pagos = (o.pagos || []).map((pg) => pg.medio_pago?.nombre || 'Pago').join(', ');
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
                      <b>#{o.id}</b>
                      <span style={{ background: st.color, color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', margin: '10px 0', color: 'var(--text-light)' }}>{items || '—'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-light)' }}>{pagos || 'Pago en mostrador'}</span>
                      <b style={{ color: 'var(--primary)' }}>{money(o.total)}</b>
                    </div>
                    {o.factura_venta && (
                      <p style={{ fontSize: '12px', margin: '6px 0 0', color: 'var(--text-light)' }}>
                        <i className="fa-solid fa-file-invoice"></i> {o.factura_venta.numero_factura}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* CHAT */}
          <div className={`section${section === 'chat' ? ' active' : ''}`}>
            <div className="chat-layout">
              <div className="chat-header">
                <img src="https://ui-avatars.com/api/?name=Barista&background=293f2c&color=fff" alt="Soporte" />
                <div>
                  <div style={{ fontWeight: '600' }}>{chatContacto?.nombre || 'Soporte Kaffa'}</div>
                  <small style={{ opacity: 0.8 }}>En línea</small>
                </div>
              </div>
              <div className="chat-messages" ref={chatMessagesRef}>
                {messages.length === 0 && (
                  <div className="msg msg-barista"><i className="fa-solid fa-hand-wave"></i> ¡Hola! ¿En qué te puedo ayudar hoy?</div>
                )}
                {messages.map((m) => (
                  <div className={`msg ${m.remitente_id == user?.id ? 'msg-user' : 'msg-barista'}`} key={m.id}>
                    {m.mensaje}
                    <div className="meta">{new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Escribe..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="chat-send-btn" onClick={sendMessage}><i className="fa-solid fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DETALLE PRODUCTO */}
      {currentProduct && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setCurrentProduct(null)}>&times;</button>
            <img
              src={currentProduct.imagen || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'}
              style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
              alt={currentProduct.nombre}
            />
            <h2>{currentProduct.nombre}</h2>
            <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.2rem' }}>{money(currentProduct.precio_venta)}</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>{currentProduct.descripcion || ''}</p>
            <button className="btn-primary" onClick={addToCart} style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-cart-plus"></i> Agregar al Carrito
            </button>
          </div>
        </div>
      )}

      {/* MODAL CARRITO */}
      {showCartModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowCartModal(false)}>&times;</button>
            <h2><i className="fa-solid fa-cart-shopping"></i> Tu Carrito</h2>
            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center' }}>Vacío</p>
              ) : (
                cart.map((i, x) => (
                  <div className="cart-item" key={x}>
                    <div>
                      <b>{i.nombre}</b> x{i.qty}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {money((Number(i.precio_venta) || 0) * i.qty)}{' '}
                      <i className="fa-solid fa-trash" style={{ color: 'red', cursor: 'pointer' }} onClick={() => remCart(x)}></i>
                    </div>
                  </div>
                ))
              )}
            </div>
            <h3 style={{ textAlign: 'right' }}>
              Total: <span style={{ color: 'var(--primary)' }}>{money(cartTotal)}</span>
            </h3>
            <button className="btn-primary" onClick={openPaymentModal} style={{ marginTop: '15px', width: '100%', justifyContent: 'center', background: 'var(--success, #27ae60)' }}>
              <i className="fa-solid fa-check"></i> Confirmar Pedido
            </button>
          </div>
        </div>
      )}

      {/* MODAL PAGO */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>&times;</button>
            <h2><i className="fa-solid fa-credit-card"></i> Método de Pago</h2>

            <div className="form-group">
              <label>¿Cómo pagas?</label>
              <div className="payment-options">
                <div className={`payment-opt${!payOnline ? ' selected' : ''}`} onClick={() => setPayOnline(false)}>
                  <i className="fa-solid fa-money-bill"></i> Efectivo en mostrador
                </div>
                <div className={`payment-opt${payOnline ? ' selected' : ''}`} onClick={() => setPayOnline(true)}>
                  <i className="fa-solid fa-mobile-screen"></i> Pagar ya (transferencia)
                </div>
              </div>
            </div>

            {payOnline && (
              <>
                <div className="form-group">
                  <label>Medio de Pago</label>
                  <select value={paymentMedioId} onChange={(e) => setPaymentMedioId(e.target.value)}>
                    {medios.filter((m) => m.es_virtual).map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>URL del Comprobante (obligatorio para medios virtuales)</label>
                  <input type="text" placeholder="https://... (link de la captura)" value={comprobanteUrl} onChange={(e) => setComprobanteUrl(e.target.value)} />
                  <small className="text-muted">Ej: enlace público de la captura del pago. El barista la verificará.</small>
                </div>
              </>
            )}

            <button className="btn-primary" onClick={finalizeOrder} disabled={enviando} style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-check"></i> {enviando ? 'Enviando…' : 'Finalizar Pedido'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL PERFIL */}
      {profileOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setProfileOpen(false)}>&times;</button>
            <h2><i className="fa-solid fa-user-gear"></i> Mi Perfil</h2>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <img src={profile.avatar || profileAvatar} className="profile-modal-avatar" alt="Perfil" />
              <br />
              <button className="btn-icon" onClick={() => profileFileInputRef.current?.click()} style={{ marginTop: '6px' }}>
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
                    r.onload = (ev) => setProfile((p) => ({ ...p, avatar: ev.target.result }));
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
              <label>Nueva Contraseña (opcional)</label>
              <input type="password" value={profile.password} placeholder="Mín. 8: mayúscula, minúscula, número y símbolo" onChange={(e) => setProfile((p) => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setProfileOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveProfile} disabled={savingProfile}>
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
