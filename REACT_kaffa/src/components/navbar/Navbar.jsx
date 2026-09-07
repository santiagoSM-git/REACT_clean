import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '../../lib/auth';
import { useCarrito } from '../../context/CarritoContext';
import { useChatNoLeidos } from '../../hooks/useChatNoLeidos';

const LINKS = [
  { to: '/', label: 'Inicio', page: 'index', icon: 'home' },
  { to: '/menu', label: 'Menú', page: 'menu', icon: 'coffee' },
  { to: '/eventos', label: 'Eventos', page: 'eventos', icon: 'calendar' },
  { to: '/sobre-nosotros', label: 'Sobre Nosotros', page: 'sobre_nosotros', icon: 'info' },
  { to: '/contacto', label: 'Contacto', page: 'contactos', icon: 'mail' },
];

const ICONS = {
  home: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  coffee: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  calendar: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  info: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  mail: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  login: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  register: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  user: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  cart: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  orders: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  chat: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

function NavItem({ to, label, page }) {
  return (
    <li data-page={page}>
      <NavLink to={to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
        {label}
      </NavLink>
    </li>
  );
}

function SidebarItem({ to, label, page, icon }) {
  return (
    <li data-page={page}>
      <NavLink to={to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
        {ICONS[icon]}
        {label}
      </NavLink>
    </li>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  // Sesión: el cliente se queda en el sitio público con sus funciones habilitadas
  const [user, setUser] = useState(() => (Auth.isLoggedIn() ? Auth.getCurrentUser() : null));
  const esCliente = !!user && Auth.isCliente();

  const carrito = useCarrito();
  const noLeidos = useChatNoLeidos(esCliente);
  const [dropOpen, setDropOpen] = useState(false);
  const userWrapRef = useRef(null);

  useEffect(() => {
    const refresh = () => setUser(Auth.isLoggedIn() ? Auth.getCurrentUser() : null);
    refresh();
    window.addEventListener('kaffa-auth-change', refresh);
    return () => window.removeEventListener('kaffa-auth-change', refresh);
  }, [location.pathname]);

  // Cerrar el dropdown del usuario al navegar o hacer clic fuera
  useEffect(() => {
    setDropOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!dropOpen) return undefined;
    const onClick = (e) => {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [dropOpen]);

  // Efecto de scroll: sombra en el navbar solo en la página de inicio
  useEffect(() => {
    if (!isHomePage) return undefined;
    const navbar = document.getElementById('main-navbar');
    if (!navbar) return undefined;

    const onScroll = () => {
      navbar.style.boxShadow = window.scrollY > 50 ? 'var(--shadow-md)' : 'none';
      navbar.style.borderBottomColor =
        window.scrollY > 50 ? 'var(--border)' : 'transparent';
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

  // Cerrar el menú móvil al navegar
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    setMenuOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleLogout = async () => {
    await Auth.logout();
    closeMenu();
    setDropOpen(false);
    navigate('/', { replace: true });
  };

  const firstName = (user?.nombre || '').split(' ')[0];
  const cartCount = carrito?.cart.length || 0;

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-left">
        <button
          className={`navbar-toggle${menuOpen ? ' active' : ''}`}
          id="navbar-toggle"
          aria-label="Menú"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <Link to="/" className="navbar-brand" id="navbar-brand-link">
          <img className="navbar-logo-img" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
          <span className="navbar-brand-text">
            <span className="navbar-brand-title">KAFFA</span>
            <span className="navbar-brand-subtitle">Café Artesanal</span>
          </span>
        </Link>
      </div>

      <ul className="navbar-links" id="nav-links">
        {LINKS.map((link) => (
          <NavItem key={link.to} {...link} />
        ))}
      </ul>

      <div className="navbar-actions">
        {user ? (
          <>
            {esCliente && carrito && (
              <button type="button" className="nav-cart" onClick={carrito.abrirCarro} title="Mi carrito" aria-label="Mi carrito">
                {ICONS.cart}
                {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
              </button>
            )}
            {esCliente ? (
              <div className="nav-user-wrap" ref={userWrapRef}>
                <button
                  type="button"
                  className="nav-btn nav-btn-outline"
                  onClick={() => setDropOpen((v) => !v)}
                  style={{ font: 'inherit', background: 'none' }}
                >
                  Hola, {firstName} <i className="fa-solid fa-caret-down" style={{ marginLeft: 6 }}></i>
                </button>
                <div className={`nav-dropdown${dropOpen ? ' open' : ''}`}>
                  <button type="button" onClick={() => { setDropOpen(false); carrito?.abrirPerfil(); }}>
                    {ICONS.user} Mi Perfil
                  </button>
                  <NavLink to="/pedidos">Mis Pedidos</NavLink>
                  <NavLink to="/chat">
                    Chat Barista
                    {noLeidos > 0 && <span className="nav-badge">{noLeidos}</span>}
                  </NavLink>
                  <div className="dropdown-sep"></div>
                  <button type="button" className="dropdown-logout" onClick={handleLogout}>
                    {ICONS.logout} Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="nav-btn nav-btn-solid" onClick={handleLogout} style={{ font: 'inherit' }}>
                Cerrar Sesión
              </button>
            )}
          </>
        ) : (
          <>
            <Link to="/registro" className="nav-btn nav-btn-outline">
              Registrarse
            </Link>
            <Link to="/login" className="nav-btn nav-btn-solid">
              Iniciar Sesión
            </Link>
          </>
        )}
      </div>

      <div
        className={`sidebar-overlay${menuOpen ? ' open' : ''}`}
        id="sidebar-overlay"
        onClick={closeMenu}
      ></div>

      <aside className={`sidebar${menuOpen ? ' open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <img src="/imagenes/logo_kaffa.jpg" alt="KAFFA" className="sidebar-logo" />
          <div className="sidebar-header-text">
            <span className="sidebar-title">KAFFA</span>
            <span className="sidebar-subtitle">Café Artesanal</span>
          </div>
        </div>
        <div className="sidebar-body">
          <ul className="sidebar-links">
            {LINKS.map((link) => (
              <SidebarItem key={link.to} {...link} />
            ))}
          </ul>
          <div className="sidebar-divider"></div>
          <ul className="sidebar-auth">
            {user ? (
              <>
                <li>
                  <span className="nav-btn" style={{ cursor: 'default', border: 'none' }}>
                    {ICONS.user}
                    {user.nombre}
                  </span>
                </li>
                {esCliente && carrito && (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={() => { carrito.abrirPerfil(); closeMenu(); }}
                        style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer' }}
                      >
                        {ICONS.user}
                        Mi Perfil
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => { carrito.abrirCarro(); closeMenu(); }}
                        style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer' }}
                      >
                        {ICONS.cart}
                        Carrito
                        {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                      </button>
                    </li>
                    <li>
                      <NavLink to="/pedidos">
                        {ICONS.orders}
                        Mis Pedidos
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/chat">
                        {ICONS.chat}
                        Chat Barista
                        {noLeidos > 0 && <span className="nav-badge">{noLeidos}</span>}
                      </NavLink>
                    </li>
                  </>
                )}
                <li>
                  <NavLink to="/" onClick={handleLogout}>
                    {ICONS.logout}
                    Cerrar Sesión
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    {ICONS.login}
                    Iniciar Sesión
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/registro" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    {ICONS.register}
                    Registrarse
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </aside>
    </nav>
  );
}

export default Navbar;
