import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Auth } from '../../lib/auth';
import { Api } from '../../lib/api';

const LINKS = [
  { to: '/barista-dashboard/pedidos', icon: 'fa-columns', label: 'Tablero Pedidos' },
  { to: '/barista-dashboard/inventario', icon: 'fa-boxes-stacked', label: 'Inventario' },
  { to: '/barista-dashboard/chat', icon: 'fa-comments', label: 'Chat Cliente' },
  { to: '/barista-dashboard/caja', icon: 'fa-cash-register', label: 'Caja' },
];

export default function SidebarBarista({ open = false, onClose }) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      try {
        const resp = await Api.get('/mensajes');
        const n = (resp.contactos || []).reduce((s, c) => s + (c.no_leidos || 0), 0);
        setUnread(n);
      } catch {
        /* noop */
      }
    };
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, []);

  const logout = async () => {
    if (window.confirm('¿Cerrar sesión?')) {
      await Auth.logout();
      navigate('/login');
    }
  };

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <img src="/imagenes/logo_kaffa.jpg" alt="KAFFA" className="sidebar-logo" />
        <div className="sidebar-header-text">
          <span className="sidebar-title">KAFFA</span>
          <span className="sidebar-subtitle">Panel de Barista</span>
        </div>
      </div>
      <div className="sidebar-body">
        <nav className="sidebar-links">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <i className={`fa-solid ${link.icon}`}></i> {link.label}
              {link.label === 'Chat Cliente' && unread > 0 && (
                <span className="chat-unread-badge">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-auth">
          <a className="sidebar-link" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </a>
        </nav>
      </div>
    </aside>
  );
}
