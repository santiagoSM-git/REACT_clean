import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../../hooks/useStyles';
import { useDashboardTheme } from '../../hooks/useDashboardTheme';
import { Auth } from '../../lib/auth';
import { Storage } from '../../lib/storage';
import { ProductosStore } from '../../lib/productos-store';
import { formatDateTime, generatePassword, generateUsername } from '../../lib/utils';

const ESTADOS_PEDIDO = {
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  prep: { label: 'En Preparación', cls: 'badge-info' },
  ready: { label: 'Listo', cls: 'badge-primary' },
  entregado: { label: 'Entregado', cls: 'badge-success' },
};

const CHART_CDN = 'https://cdn.jsdelivr.net/npm/chart.js';

function formatearTotal(valor) {
  const total =
    typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^\d.-]/g, '')) || 0;
  return '$' + total.toLocaleString('es-CO');
}

function formatearFechaReporte(fecha) {
  if (!fecha) return '—';
  return String(fecha).includes('T') ? formatDateTime(fecha) : fecha;
}

function DashboardAdmin() {
  useStyles(['dashboard-base.css', 'dashboard-admin.css']);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDashboardTheme();

  const [user, setUser] = useState(() => Auth.getCurrentUser());
  const [section, setSection] = useState('inicio');
  const [sideOpen, setSideOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [baristas, setBaristas] = useState(() => Storage.get(Storage.KEYS.BARISTAS, []));
  const [inventario, setInventario] = useState(() =>
    Storage.get(Storage.KEYS.PRODUCTOS, [
      { id: 'PROD-001', nombre: 'Café Grano Premium', cat: 'Café', und: 'kg', cant: 15, precio: 45.0, prov: 'Café Colombia' },
    ]),
  );
  const [orders, setOrders] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [menuTick, setMenuTick] = useState(0);

  // Modales
  const [baristaModal, setBaristaModal] = useState(null); // {editingId, nombre, turno, usuario, pass}
  const [productoModal, setProductoModal] = useState(null);
  const [menuProductoModal, setMenuProductoModal] = useState(null);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: user?.nombre || 'Admin', email: user?.email || 'admin@kaffa.com' });

  const salesChartRef = useRef(null);
  const productsChartRef = useRef(null);
  const profileFileInputRef = useRef(null);
  const syncCache = useRef({});

  // ── Guard de autenticación ──
  useEffect(() => {
    if (!Auth.isAdmin()) {
      alert('⚠️ No tienes permiso para acceder a esta página.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // ── Cargar chart.js dinámicamente y dibujar gráficas ──
  useEffect(() => {
    let cancelled = false;
    const script = document.createElement('script');
    script.src = CHART_CDN;
    script.async = true;
    script.onload = () => {
      if (cancelled) return;
      const Chart = window.Chart;
      if (!Chart) return;
      if (salesChartRef.current) {
        const prev = Chart.getChart(salesChartRef.current);
        if (prev) prev.destroy();
        new Chart(salesChartRef.current, {
          type: 'line',
          data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
              {
                label: 'Ingresos ($)',
                data: [800, 950, 880, 1200, 1500, 1800, 1250],
                borderColor: '#39A900',
                backgroundColor: 'rgba(57,169,0,0.10)',
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: { responsive: true, maintainAspectRatio: false },
        });
      }
      if (productsChartRef.current) {
        const prev = Chart.getChart(productsChartRef.current);
        if (prev) prev.destroy();
        new Chart(productsChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Café', 'Repostería', 'Bebidas Frías'],
            datasets: [{ data: [55, 30, 15], backgroundColor: ['#39A900', '#4DBD8B', '#6BCF9E'] }],
          },
          options: { responsive: true, maintainAspectRatio: false },
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      script.remove();
    };
  }, []);

  // ── Carga inicial de datos ──
  useEffect(() => {
    setOrders(Storage.getOrders().slice().reverse());
    setClientes(Storage.getUsuarios().slice().reverse());
    setReportes(Storage.getReportes().slice().reverse());
    setMenuTick((t) => t + 1);
  }, []);

  // ── Polling tiempo real ──
  useEffect(() => {
    const sync = () => {
      const renderIfChanged = (key, getter, setter) => {
        const j = JSON.stringify(getter());
        if (syncCache.current[key] !== j) {
          syncCache.current[key] = j;
          setter(j);
        }
      };
      renderIfChanged('pedidos', () => Storage.getOrders().slice().reverse(), (v) => setOrders(JSON.parse(v)));
      renderIfChanged('reportes', () => Storage.getReportes().slice().reverse(), (v) => setReportes(JSON.parse(v)));
      renderIfChanged('clientes', () => Storage.getUsuarios().slice().reverse(), (v) => setClientes(JSON.parse(v)));
      renderIfChanged('menu', () => ProductosStore.getCustom(), (v) => { JSON.parse(v); setMenuTick((t) => t + 1); });
    };
    const interval = setInterval(sync, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Cerrar dropdown al hacer clic fuera ──
  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.profile-trigger')) setDropdownOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ── Persistencia de baristas/inventario ──
  const guardarBaristas = (next) => {
    setBaristas(next);
    Storage.set(Storage.KEYS.BARISTAS, next);
  };
  const guardarInventario = (next) => {
    setInventario(next);
    Storage.set(Storage.KEYS.PRODUCTOS, next);
  };

  const guardarBarista = () => {
    if (!baristaModal) return;
    const { editingId, nombre, turno, usuario, pass } = baristaModal;
    if (!nombre) {
      alert('Nombre requerido');
      return;
    }
    if (editingId != null) {
      const next = baristas.map((b) => (b.id == editingId ? { ...b, nombre, turno } : b));
      guardarBaristas(next);
    } else {
      guardarBaristas([
        ...baristas,
        {
          id: Date.now(),
          nombre,
          turno,
          usuario,
          pass,
          fecha: new Date().toLocaleDateString(),
          role: 'barista',
        },
      ]);
    }
    setBaristaModal(null);
  };

  const guardarProducto = () => {
    if (!productoModal) return;
    const { editingId, nombre, cat, und, cant, precio, prov } = productoModal;
    if (!nombre) {
      alert('Nombre requerido');
      return;
    }
    if (editingId != null) {
      const next = inventario.map((p) =>
        p.id == editingId ? { ...p, nombre, cat, und, cant, precio, prov } : p,
      );
      guardarInventario(next);
    } else {
      const nuevo = {
        id: 'PROD-' + String(inventario.length + 1).padStart(3, '0'),
        nombre,
        cat,
        und,
        cant,
        precio,
        prov,
      };
      guardarInventario([...inventario, nuevo]);
    }
    setProductoModal(null);
  };

  const guardarMenuProducto = () => {
    if (!menuProductoModal) return;
    const { editingId, nombre, categoria, precio, descripcion, imagen } = menuProductoModal;
    if (!nombre.trim()) {
      alert('⚠️ El nombre es requerido.');
      return;
    }
    if (Number.isNaN(Number(precio)) || Number(precio) <= 0) {
      alert('⚠️ Ingresa un precio válido.');
      return;
    }
    const data = {
      nombre: nombre.trim(),
      categoria,
      precio: Number(precio),
      descripcion: descripcion.trim(),
      imagen: imagen.trim() || ProductosStore.IMAGEN_DEFAULT,
    };
    if (editingId != null) {
      ProductosStore.updateProducto(editingId, data);
    } else {
      ProductosStore.addProducto(data);
    }
    setMenuProductoModal(null);
    setMenuTick((t) => t + 1);
  };

  const cambiarEstadoPedido = (id, estado) => {
    const list = Storage.getOrders();
    const o = list.find((x) => x.id === id);
    if (o && o.status !== estado) {
      o.status = estado;
      Storage.setOrders(list);
      setOrders(list.slice().reverse());
    }
  };

  const verPedido = (id) => {
    const p = Storage.getOrders().find((x) => x.id === id);
    if (p) setPedidoDetalle(p);
  };

  const verCliente = (username) => {
    const u = Storage.getUsuarios().find((x) => x.username === username);
    if (u) setClienteDetalle(u);
  };

  const logout = () => {
    if (window.confirm('¿Salir del sistema?')) {
      Auth.logout();
      navigate('/');
    }
  };

  const saveProfile = () => {
    const u = Auth.getCurrentUser() || {};
    u.nombre = profile.name;
    u.email = profile.email;
    if (profile.avatar) u.avatar = profile.avatar;
    Storage.setCurrentUser(u);
    setUser(u);
    setProfileOpen(false);
  };

  // ── Migración de datos antiguos (una vez) ──
  useEffect(() => {
    const oldAvatar = Storage.get(Storage.KEYS.ADMIN_AVATAR);
    const oldTheme = Storage.get(Storage.KEYS.ADMIN_TEMA);
    const kaffaUser = Auth.getCurrentUser() || {};
    if (oldAvatar && !kaffaUser.avatar) {
      kaffaUser.avatar = oldAvatar;
      Storage.setCurrentUser(kaffaUser);
    }
    Storage.remove(Storage.KEYS.ADMIN_AVATAR);
    if (oldTheme && !localStorage.getItem('kaffaTheme')) {
      localStorage.setItem('kaffaTheme', oldTheme);
    }
    Storage.remove(Storage.KEYS.ADMIN_TEMA);
  }, []);

  const NAV = [
    { id: 'inicio', icon: 'fa-house', label: 'Inicio' },
    { id: 'pedidos', icon: 'fa-clipboard-list', label: 'Pedidos' },
    { id: 'productos', icon: 'fa-mug-hot', label: 'Productos' },
    { id: 'clientes', icon: 'fa-user', label: 'Clientes' },
    { id: 'baristas', icon: 'fa-users', label: 'Baristas' },
    { id: 'inventario', icon: 'fa-boxes-stacked', label: 'Inventario' },
    { id: 'reportes', icon: 'fa-chart-simple', label: 'Reportes' },
    { id: 'config', icon: 'fa-gear', label: 'Configuración' },
  ];

  const todosMenu = ProductosStore.obtenerTodos();

  const profileAvatar =
    user?.avatar ||
    'https://ui-avatars.com/api/?name=Admin&background=293f2c&color=fff&size=40';

  const badgeEstadoProducto = (cant) => {
    if (cant <= 0) return <span className="badge badge-danger">Agotado</span>;
    if (cant <= 5) return <span className="badge badge-warning">Bajo</span>;
    return <span className="badge badge-success">Disponible</span>;
  };

  return (
    <>
      <div className={`sidebar-overlay${sideOpen ? ' open' : ''}`} id="darkOverlay" onClick={() => setSideOpen(false)}></div>

      <div className="app">
        {/* SIDEBAR */}
        <aside className={`sidebar${sideOpen ? ' open' : ''}`} id="side">
          <div className="sidebar-header">
            <img src="/imagenes/logo_kaffa.jpg" alt="KAFFA" className="sidebar-logo" />
            <div className="sidebar-header-text">
              <span className="sidebar-title">KAFFA Admin</span>
              <span className="sidebar-subtitle">Panel de Control</span>
            </div>
          </div>
          <div className="sidebar-body">
            <nav className="sidebar-links">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar-link${section === item.id ? ' active' : ''}`}
                  data-page={item.id}
                  onClick={() => setSection(item.id)}
                >
                  <i className={`fa-solid ${item.icon}`}></i> {item.label}
                </button>
              ))}
            </nav>
            <div className="sidebar-divider"></div>
            <nav className="sidebar-auth">
              <button className="sidebar-link" id="sidebarLogout" onClick={logout}>
                <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
              </button>
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="main">
          <header className="topbar">
            <button className="sidebar-toggle" id="ham" onClick={() => setSideOpen((v) => !v)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <h1 className="page-title" id="titulo">
              {NAV.find((n) => n.id === section)?.label || 'Dashboard'}
            </h1>
            <div className="topbar-right">
              <div className="profile-wrap">
                <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                  <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                <div className="profile-trigger" onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v); }}>
                  <img src={profileAvatar} id="profileAvatar" className="profile-avatar" alt="Perfil" />
                  <div className="profile-info">
                    <div className="profile-name" id="profileName">{user?.nombre || 'Admin'}</div>
                    <div className="profile-role" id="profileRole">Administrador</div>
                  </div>
                  <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                  <div className={`profile-dropdown${dropdownOpen ? ' show' : ''}`} id="profileDropdown">
                    <div className="dropdown-item" onClick={() => setProfileOpen(true)}>
                      <i className="fa-solid fa-user-pen"></i> Editar Perfil
                    </div>
                    <div className="dropdown-item logout" onClick={logout}>
                      <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="content">
            {/* INICIO */}
            <div id="inicio" className={`page${section === 'inicio' ? ' show' : ''}`}>
              <div className="cards-grid">
                <div className="card">
                  <div className="card-head">
                    <h3>Ingresos Hoy</h3>
                    <i className="fa-solid fa-coins" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}></i>
                  </div>
                  <div className="card-val">$1,250</div>
                  <div className="card-trend green">
                    <i className="fa-solid fa-arrow-up"></i> 5% vs ayer
                  </div>
                </div>
                <div className="card">
                  <div className="card-head">
                    <h3>Pedidos</h3>
                    <i className="fa-solid fa-receipt" style={{ fontSize: '1.4rem', color: 'var(--warning)' }}></i>
                  </div>
                  <div className="card-val">89</div>
                  <div className="card-trend red">
                    <i className="fa-solid fa-arrow-down"></i> 1% vs ayer
                  </div>
                </div>
                <div className="card">
                  <div className="card-head">
                    <h3>Clientes Nuevos</h3>
                    <i className="fa-solid fa-user-plus" style={{ fontSize: '1.4rem', color: 'var(--info)' }}></i>
                  </div>
                  <div className="card-val">32</div>
                  <div className="card-trend green">
                    <i className="fa-solid fa-arrow-up"></i> 10% vs ayer
                  </div>
                </div>
                <div className="card">
                  <div className="card-head">
                    <h3>Ticket Promedio</h3>
                    <i className="fa-solid fa-credit-card" style={{ fontSize: '1.4rem', color: 'var(--success)' }}></i>
                  </div>
                  <div className="card-val">$14.04</div>
                  <div className="card-trend green">
                    <i className="fa-solid fa-arrow-up"></i> $0.50
                  </div>
                </div>
              </div>
              <div className="charts-grid">
                <div className="box">
                  <div className="box-top">
                    <h3>
                      <i className="fa-solid fa-chart-line"></i> Ingresos Semanales
                    </h3>
                  </div>
                  <div style={{ position: 'relative', height: '250px' }}>
                    <canvas id="salesChart" ref={salesChartRef}></canvas>
                  </div>
                </div>
                <div className="box">
                  <div className="box-top">
                    <h3>
                      <i className="fa-solid fa-chart-pie"></i> Top Productos
                    </h3>
                  </div>
                  <div style={{ position: 'relative', height: '250px' }}>
                    <canvas id="productsChart" ref={productsChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>

            {/* PEDIDOS */}
            <div id="pedidos" className={`page${section === 'pedidos' ? ' show' : ''}`}>
              <div className="box">
                <div className="box-top">
                  <h3>
                    <i className="fa-solid fa-clipboard-list"></i> Últimos Pedidos
                  </h3>
                  <button className="btn-primary" onClick={() => alert('Exportando…')}>
                    <i className="fa-solid fa-download"></i> Exportar
                  </button>
                </div>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID Pedido</th>
                        <th>Cliente</th>
                        <th>Productos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="tbPedidos">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="6">
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Sin pedidos</p>
                          </td>
                        </tr>
                      ) : (
                        orders.map((p) => {
                          const st = ESTADOS_PEDIDO[p.status] || ESTADOS_PEDIDO.pending;
                          return (
                            <tr key={p.id}>
                              <td><b>{p.id}</b></td>
                              <td>{p.cliente || '—'}</td>
                              <td style={{ maxWidth: '260px' }}>{(p.items || []).join(', ')}</td>
                              <td>{formatearTotal(p.total)}</td>
                              <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                              <td>
                                <select
                                  className="pedido-estado-select"
                                  value={p.status || 'pending'}
                                  onChange={(e) => cambiarEstadoPedido(p.id, e.target.value)}
                                >
                                  {Object.keys(ESTADOS_PEDIDO).map((k) => (
                                    <option key={k} value={k}>
                                      {ESTADOS_PEDIDO[k].label}
                                    </option>
                                  ))}
                                </select>{' '}
                                <button className="btn-icon view" onClick={() => verPedido(p.id)}>
                                  <i className="fa-solid fa-eye"></i> Ver
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* PRODUCTOS MENÚ */}
            <div id="productos" className={`page${section === 'productos' ? ' show' : ''}`}>
              <div className="box">
                <div className="box-top">
                  <h3>
                    <i className="fa-solid fa-mug-hot"></i> Productos del Menú
                  </h3>
                  <button className="btn-primary" onClick={() => setMenuProductoModal({})}>
                    <i className="fa-solid fa-plus"></i> Nuevo Producto
                  </button>
                </div>
                <p className="text-muted" style={{ marginTop: '6px' }}>
                  Catálogo compartido: los cambios se reflejan en el menú público, el index y la app del cliente.
                </p>
                <div className="tbl-wrap" style={{ marginTop: '20px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Origen</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="tbMenuProductos">
                      {todosMenu.length === 0 ? (
                        <tr>
                          <td colSpan="5">
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Sin productos</p>
                          </td>
                        </tr>
                      ) : (
                        todosMenu.map((p) => {
                          const editable = ProductosStore.esProductoPersonalizado(p);
                          return (
                            <tr key={p.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <img src={p.imagen} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} />
                                  <b>{p.nombre}</b>
                                </div>
                              </td>
                              <td>{p.categoria}</td>
                              <td>{formatearTotal(p.precio)}</td>
                              <td>
                                {editable ? <span className="badge badge-info">Personalizado</span> : <span className="badge badge-success">Base</span>}
                              </td>
                              <td>
                                {editable ? (
                                  <>
                                    <button
                                      className="btn-icon edit"
                                      onClick={() => {
                                        const prod = ProductosStore.getCustom().find((x) => x.id == p.id);
                                        if (!prod) return alert('❌ Este producto no puede editarse.');
                                        setMenuProductoModal({
                                          editingId: prod.id,
                                          nombre: prod.nombre,
                                          categoria: prod.categoria,
                                          precio: prod.precio,
                                          descripcion: prod.descripcion || '',
                                          imagen: prod.imagen || '',
                                        });
                                      }}
                                    >
                                      <i className="fa-solid fa-pen-to-square"></i>
                                    </button>{' '}
                                    <button
                                      className="btn-icon delete"
                                      onClick={() => {
                                        if (window.confirm('¿Eliminar este producto del menú?')) {
                                          ProductosStore.deleteProducto(p.id);
                                          setMenuTick((t) => t + 1);
                                        }
                                      }}
                                    >
                                      <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-muted" style={{ fontSize: '12px' }}>Catálogo base</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CLIENTES */}
            <div id="clientes" className={`page${section === 'clientes' ? ' show' : ''}`}>
              <div className="box">
                <div className="box-top">
                  <h3>
                    <i className="fa-solid fa-user"></i> Gestión de Clientes
                  </h3>
                  <span className="badge badge-info" id="clientesCount">
                    {clientes.length} cliente{clientes.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-muted" style={{ marginTop: '6px' }}>
                  Los clientes registrados desde la web aparecen automáticamente aquí.
                </p>
                <div className="tbl-wrap" style={{ marginTop: '20px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Fecha de Registro</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="tbClientes">
                      {clientes.length === 0 ? (
                        <tr>
                          <td colSpan="5">
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Sin clientes registrados</p>
                          </td>
                        </tr>
                      ) : (
                        clientes.map((u) => (
                          <tr key={u.username}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '30px', height: '30px', background: 'var(--surface-alt)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                  <i className="fa-solid fa-user"></i>
                                </div>
                                <b>{u.nombre || u.username}</b>
                              </div>
                            </td>
                            <td><code>{u.username}</code></td>
                            <td>{u.email || '—'}</td>
                            <td>{u.fechaRegistro ? formatDateTime(u.fechaRegistro) : '—'}</td>
                            <td>
                              <button className="btn-icon view" onClick={() => verCliente(u.username)}>
                                <i className="fa-solid fa-eye"></i> Ver
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* BARISTAS */}
            <div id="baristas" className={`page${section === 'baristas' ? ' show' : ''}`}>
              <div className="box">
                <div className="box-top">
                  <h3>
                    <i className="fa-solid fa-users"></i> Gestionar Baristas
                  </h3>
                  <button
                    className="btn-primary"
                    onClick={() => setBaristaModal({ editingId: null, nombre: '', turno: 'Mañana', usuario: '', pass: '' })}
                  >
                    <i className="fa-solid fa-plus"></i> Agregar Barista
                  </button>
                </div>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Turno</th>
                        <th>Fecha Reg.</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="tbB">
                      {baristas.length === 0 ? (
                        <tr>
                          <td colSpan="6">
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Sin registros</p>
                          </td>
                        </tr>
                      ) : (
                        baristas.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '30px', height: '30px', background: 'var(--surface-alt)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                  <i className="fa-solid fa-user"></i>
                                </div>
                                <b>{b.nombre}</b>
                              </div>
                            </td>
                            <td><code>{b.usuario}</code></td>
                            <td>{b.turno}</td>
                            <td>{b.fecha}</td>
                            <td><span className="badge badge-success">Activo</span></td>
                            <td>
                              <button
                                className="btn-icon edit"
                                onClick={() =>
                                  setBaristaModal({
                                    editingId: b.id,
                                    nombre: b.nombre,
                                    turno: b.turno,
                                    usuario: b.usuario,
                                    pass: b.pass,
                                  })
                                }
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>{' '}
                              <button
                                className="btn-icon delete"
                                onClick={() => {
                                  if (window.confirm('¿Eliminar barista?')) {
                                    guardarBaristas(baristas.filter((x) => x.id !== b.id));
                                  }
                                }}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* INVENTARIO */}
            <div id="inventario" className={`page${section === 'inventario' ? ' show' : ''}`}>
              <div className="box">
                <div className="box-top">
                  <h3>
                    <i className="fa-solid fa-boxes-stacked"></i> Inventario & Insumos
                  </h3>
                  <button className="btn-primary" onClick={() => setProductoModal({ editingId: null, nombre: '', cat: 'Café', und: 'kg', cant: 0, precio: 0, prov: '' })}>
                    <i className="fa-solid fa-plus"></i> Nuevo Producto
                  </button>
                </div>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Cant.</th>
                        <th>Und.</th>
                        <th>Precio Compra</th>
                        <th>Proveedor</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="tbP">
                      {inventario.length === 0 ? (
                        <tr>
                          <td colSpan="9">
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Vacío</p>
                          </td>
                        </tr>
                      ) : (
                        inventario.map((p) => (
                          <tr key={p.id}>
                            <td><code>{p.id}</code></td>
                            <td><b>{p.nombre}</b></td>
                            <td>{p.cat}</td>
                            <td>{p.cant}</td>
                            <td>{p.und}</td>
                            <td>${Number(p.precio).toFixed(2)}</td>
                            <td>{p.prov}</td>
                            <td>{badgeEstadoProducto(p.cant)}</td>
                            <td>
                              <button className="btn-icon edit" onClick={() => setProductoModal({ editingId: p.id, nombre: p.nombre, cat: p.cat, und: p.und, cant: p.cant, precio: p.precio, prov: p.prov })}>
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>{' '}
                              <button
                                className="btn-icon delete"
                                onClick={() => {
                                  if (window.confirm('¿Borrar producto?')) {
                                    guardarInventario(inventario.filter((x) => x.id !== p.id));
                                  }
                                }}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* REPORTES */}
            <div id="reportes" className={`page${section === 'reportes' ? ' show' : ''}`}>
              <div className="box">
                <div className="box-top">
                  <h3>
                    <i className="fa-solid fa-chart-simple"></i> Reportes de Baristas
                  </h3>
                  <span className="badge badge-warning" id="reportesCount">
                    {reportes.length} reporte{reportes.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-muted" style={{ marginTop: '6px' }}>
                  Novedades de inventario enviadas desde el panel de barista.
                </p>
                <div className="tbl-wrap" style={{ marginTop: '20px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Barista</th>
                        <th>Mensaje</th>
                        <th>Fecha</th>
                        <th>Prioridad</th>
                      </tr>
                    </thead>
                    <tbody id="tbReportes">
                      {reportes.length === 0 ? (
                        <tr>
                          <td colSpan="4">
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Sin reportes</p>
                          </td>
                        </tr>
                      ) : (
                        reportes.map((r) => {
                          const cls = r.prioridad === 'Alta' ? 'badge-danger' : r.prioridad === 'Media' ? 'badge-warning' : 'badge-info';
                          return (
                            <tr key={r.id}>
                              <td><b>{r.barista || '—'}</b></td>
                              <td>{r.mensaje || '—'}</td>
                              <td>{formatearFechaReporte(r.fecha)}</td>
                              <td><span className={`badge ${cls}`}>{r.prioridad || 'Baja'}</span></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CONFIGURACION */}
            <div id="config" className={`page${section === 'config' ? ' show' : ''}`}>
              <div className="box">
                <h3 className="section-title">
                  <i className="fa-solid fa-gear"></i> Configuración General
                </h3>
                <p className="text-muted">Ajustes del sistema.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL BARISTA */}
      {baristaModal && (
        <div id="mB" className="modal-overlay open">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setBaristaModal(null)}>&times;</button>
            <h2 id="tB">{baristaModal.editingId != null ? 'Editar Barista' : 'Agregar Barista'}</h2>
            <div className="form-group">
              <label>Nombre Completo:</label>
              <input
                type="text"
                placeholder="Ej: Juan Perez"
                value={baristaModal.nombre}
                onChange={(e) => {
                  const v = e.target.value;
                  setBaristaModal((m) => ({
                    ...m,
                    nombre: v,
                    usuario: m.editingId != null || v.length <= 3 ? m.usuario : generateUsername(v),
                    pass: m.editingId != null || v.length <= 3 ? m.pass : generatePassword(),
                  }));
                }}
              />
            </div>
            <div className="form-group">
              <label>Turno:</label>
              <select value={baristaModal.turno} onChange={(e) => setBaristaModal((m) => ({ ...m, turno: e.target.value }))}>
                <option>Mañana</option>
                <option>Tarde</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Usuario (Auto):</label>
                <input type="text" value={baristaModal.usuario} readOnly />
              </div>
              <div className="form-group">
                <label>Contraseña (Auto):</label>
                <input type="text" value={baristaModal.pass} readOnly />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setBaristaModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarBarista}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO INVENTARIO */}
      {productoModal && (
        <div id="mP" className="modal-overlay open">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setProductoModal(null)}>&times;</button>
            <h2 id="tP">{productoModal.editingId != null ? 'Editar Producto' : 'Agregar Producto'}</h2>
            <div className="form-group">
              <label>Nombre del Producto:</label>
              <input type="text" value={productoModal.nombre} onChange={(e) => setProductoModal((m) => ({ ...m, nombre: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Categoría:</label>
                <select value={productoModal.cat} onChange={(e) => setProductoModal((m) => ({ ...m, cat: e.target.value }))}>
                  <option>Café</option>
                  <option>Lácteos</option>
                  <option>Repostería</option>
                  <option>Insumos</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unidad:</label>
                <select value={productoModal.und} onChange={(e) => setProductoModal((m) => ({ ...m, und: e.target.value }))}>
                  <option>kg</option>
                  <option>g</option>
                  <option>L</option>
                  <option>unidades</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad:</label>
                <input type="number" min="0" value={productoModal.cant} onChange={(e) => setProductoModal((m) => ({ ...m, cant: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Precio Compra:</label>
                <input type="number" min="0" step="0.01" value={productoModal.precio} onChange={(e) => setProductoModal((m) => ({ ...m, precio: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Proveedor:</label>
              <input type="text" value={productoModal.prov} onChange={(e) => setProductoModal((m) => ({ ...m, prov: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setProductoModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarProducto}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO MENÚ */}
      {menuProductoModal && (
        <div id="mPM" className="modal-overlay open">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setMenuProductoModal(null)}>&times;</button>
            <h2 id="tPM">{menuProductoModal.editingId != null ? 'Editar Producto del Menú' : 'Agregar Producto al Menú'}</h2>
            <div className="form-group">
              <label>Nombre del Producto:</label>
              <input type="text" placeholder="Ej: Café Frío Especial" value={menuProductoModal.nombre} onChange={(e) => setMenuProductoModal((m) => ({ ...m, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Categoría:</label>
              <select value={menuProductoModal.categoria} onChange={(e) => setMenuProductoModal((m) => ({ ...m, categoria: e.target.value }))}>
                <option value="Cafés">Cafés</option>
                <option value="Postres">Postres</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
            <div className="form-group">
              <label>Precio (COP):</label>
              <input type="number" min="0" placeholder="Ej: 9500" value={menuProductoModal.precio} onChange={(e) => setMenuProductoModal((m) => ({ ...m, precio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <textarea rows="2" placeholder="Breve descripción del producto" value={menuProductoModal.descripcion} onChange={(e) => setMenuProductoModal((m) => ({ ...m, descripcion: e.target.value }))}></textarea>
            </div>
            <div className="form-group">
              <label>URL de Imagen (opcional):</label>
              <input type="url" placeholder="https://..." value={menuProductoModal.imagen} onChange={(e) => setMenuProductoModal((m) => ({ ...m, imagen: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setMenuProductoModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarMenuProducto}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE PEDIDO */}
      {pedidoDetalle && (
        <div id="modalPedidoDetalle" className="modal-overlay open">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <button className="modal-close" onClick={() => setPedidoDetalle(null)}>&times;</button>
            <h2>
              <i className="fa-solid fa-clipboard-list"></i> Detalle del Pedido
            </h2>
            <div id="pedidoDetalleBody">
              {(() => {
                const p = pedidoDetalle;
                const st = ESTADOS_PEDIDO[p.status] || ESTADOS_PEDIDO.pending;
                return (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <p><b>ID:</b> {p.id}</p>
                      <p><b>Cliente:</b> {p.cliente || '—'}</p>
                      <p><b>Estado:</b> <span className={`badge ${st.cls}`}>{st.label}</span></p>
                      <p>
                        <b>Fecha:</b>{' '}
                        {p.timestamp ? formatDateTime(new Date(p.timestamp).toISOString()) : p.time || '—'}
                      </p>
                      <p><b>Método de pago:</b> {p.metodoPago || 'Efectivo'}</p>
                    </div>
                    <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                      <p style={{ fontWeight: '700', marginBottom: '6px' }}>Productos</p>
                      {(p.items || []).map((i, idx) => (
                        <p key={idx} style={{ fontSize: '0.85rem', padding: '2px 0' }}>• {i}</p>
                      ))}
                      <p style={{ fontWeight: '700', marginTop: '10px' }}>Total: {formatearTotal(p.total)}</p>
                    </div>
                    {p.comprobante ? (
                      <p>
                        <b>Comprobante:</b>
                        <br />
                        <img src={p.comprobante} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </p>
                    ) : (
                      <p className="text-muted">Sin comprobante adjunto (pago en efectivo).</p>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setPedidoDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE CLIENTE */}
      {clienteDetalle && (
        <div id="modalClienteDetalle" className="modal-overlay open">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setClienteDetalle(null)}>&times;</button>
            <h2>
              <i className="fa-solid fa-user"></i> Detalle del Cliente
            </h2>
            <div id="clienteDetalleBody">
              {(() => {
                const u = clienteDetalle;
                const ordenes = Storage.getOrders()
                  .filter((o) => o.cliente === u.nombre || o.cliente === u.username)
                  .reverse();
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.3rem' }}>
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <div>
                        <h3 style={{ margin: '0' }}>{u.nombre || u.username}</h3>
                        <p className="text-muted" style={{ margin: '2px 0 0' }}>
                          @{u.username}
                          {u.email ? ` · ${u.email}` : ''}
                        </p>
                      </div>
                    </div>
                    <p>
                      <b>Fecha de registro:</b>{' '}
                      {u.fechaRegistro ? formatDateTime(u.fechaRegistro) : '—'}
                    </p>
                    <h4 style={{ margin: '16px 0 10px' }}>
                      <i className="fa-solid fa-receipt"></i> Historial de Pedidos ({ordenes.length})
                    </h4>
                    {ordenes.length === 0 ? (
                      <p className="text-muted">Este cliente aún no tiene pedidos.</p>
                    ) : (
                      ordenes.map((o) => {
                        const st = ESTADOS_PEDIDO[o.status] || ESTADOS_PEDIDO.pending;
                        return (
                          <div key={o.id} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <b>{o.id}</b>
                              <span className={`badge ${st.cls}`}>{st.label}</span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '6px 0' }}>
                              {(o.items || []).join(', ')}
                            </p>
                            <p style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span className="text-muted">
                                {o.timestamp ? formatDateTime(new Date(o.timestamp).toISOString()) : o.time || '—'}
                              </span>
                              <b>{formatearTotal(o.total)}</b>
                            </p>
                          </div>
                        );
                      })
                    )}
                  </>
                );
              })()}
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setClienteDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL */}
      {profileOpen && (
        <div id="modalProfile" className="modal-overlay open">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setProfileOpen(false)}>&times;</button>
            <h2>
              <i className="fa-solid fa-user-gear"></i> Mi Perfil
            </h2>
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
              <label>
                <i className="fa-solid fa-palette"></i> Tema
              </label>
              <select
                value={theme}
                onChange={(e) => {
                  localStorage.setItem('kaffaTheme', e.target.value);
                  window.location.reload();
                }}
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setProfileOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveProfile}>
                <i className="fa-solid fa-floppy-disk"></i> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DashboardAdmin;
