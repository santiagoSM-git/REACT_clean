import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStyles } from '../../hooks/useStyles';
import { useDashboardTheme } from '../../hooks/useDashboardTheme';
import { Auth } from '../../lib/auth';
import { Storage } from '../../lib/storage';
import { BaristaProvider, useBarista } from './BaristaContext.jsx';
import SidebarBarista from './SidebarBarista';

const SECTION_TITLES = {
  pedidos: { icon: 'fa-columns', title: 'Tablero de Pedidos' },
  inventario: { icon: 'fa-boxes-stacked', title: 'Inventario' },
  chat: { icon: 'fa-comments', title: 'Chat Cliente' },
  caja: { icon: 'fa-cash-register', title: 'Cierre de Caja' },
};

function BaristaLayoutInner() {
  useStyles(['dashboard-base.css', 'dashboard.css']);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useDashboardTheme();
  const { turno, iniciarTurno } = useBarista();

  const [user, setUser] = useState(() => Auth.getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [turnoPickerOpen, setTurnoPickerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', avatar: null });
  const profileFileInputRef = useRef(null);

  const sectionKey = pathname.split('/').pop() || 'pedidos';
  const current = SECTION_TITLES[sectionKey] || SECTION_TITLES.pedidos;

  // ── Guard de autenticación ──
  useEffect(() => {
    const sessionData = Auth.getCurrentUser();
    if (!sessionData || sessionData.role !== 'barista') {
      alert('Acceso denegado.');
      navigate('/login', { replace: true });
      return;
    }
    const oldAvatar = localStorage.getItem('baristaAvatar');
    if (oldAvatar && !sessionData.avatar) {
      sessionData.avatar = oldAvatar;
      Storage.setCurrentUser(sessionData);
    }
    localStorage.removeItem('baristaAvatar');
    setUser(sessionData);
    setProfile({
      name: sessionData.nombre || 'Barista',
      email: sessionData.email || 'barista@kaffa.com',
      avatar: sessionData.avatar || null,
    });
  }, [navigate]);

  // ── Selector de turno al entrar sin turno activo ──
  useEffect(() => {
    if (!turno || !turno.activo) setTurnoPickerOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cerrar dropdown al hacer clic fuera ──
  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.profile-trigger')) setDropdownOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const logout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      Storage.remove(Storage.KEYS.USER);
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

  const profileAvatar =
    profile.avatar ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nombre || 'Barista')}&background=293f2c&color=fff`;

  return (
    <>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* SELECTOR DE TURNO */}
      {turnoPickerOpen && (
        <div className="turno-overlay" id="turnoOverlay">
          <div className="turno-overlay-icon">
            <i className="fa-solid fa-mug-hot"></i>
          </div>
          <h2>Seleccionar Turno</h2>
          <p>
            No hay un turno activo. Puedes iniciar uno para llevar el control de tus entregas, o
            trabajar sin turno.
          </p>
          <button
            className="btn-iniciar-turno"
            onClick={() => {
              iniciarTurno('AM');
              setTurnoPickerOpen(false);
            }}
          >
            <i className="fa-solid fa-sun"></i> Iniciar Turno AM
          </button>
          <button
            className="btn-iniciar-turno pm"
            onClick={() => {
              iniciarTurno('PM');
              setTurnoPickerOpen(false);
            }}
          >
            <i className="fa-solid fa-moon"></i> Iniciar Turno PM
          </button>
          <button className="btn-cerrar-turno-picker" onClick={() => setTurnoPickerOpen(false)}>
            Trabajar sin turno
          </button>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL: sidebar + contenido, lado a lado.
          data-theme se sincroniza con el estado del tema para que el
          toggle claro/oscuro funcione dentro del panel. */}
      <div className="barista-container" data-theme={theme}>
        <div className="barista-sidebar">
          <SidebarBarista open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="barista-content">
          <div className="header">
            <div className="header-title">
              <div className="menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>
                <i className="fa-solid fa-bars"></i>
              </div>
              <h1 id="headerTitle">
                <i className={`fa-solid ${current.icon}`}></i> {current.title}
              </h1>
            </div>

            <div className="profile-wrap" style={{ marginLeft: 'auto' }}>
              {!turno && (
                <button className="btn-turno-header" onClick={() => setTurnoPickerOpen(true)}>
                  <i className="fa-solid fa-mug-hot"></i> Iniciar Turno
                </button>
              )}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <div
                className="profile-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((v) => !v);
                }}
              >
                <img src={profileAvatar} className="profile-avatar" alt="Perfil" />
                <div className="profile-info">
                  <div className="profile-name">{user?.nombre || 'Barista'}</div>
                  <div className="profile-role">Barista</div>
                </div>
                <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                <div className={`profile-dropdown${dropdownOpen ? ' show' : ''}`}>
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

          <Outlet />
        </main>
      </div>

      {/* MODAL PERFIL */}
      {profileOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }} id="modalProfile">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setProfileOpen(false)}>
              &times;
            </button>
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
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                required
              />
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
    </>
  );
}

export default function BaristaLayout() {
  return (
    <BaristaProvider>
      <BaristaLayoutInner />
    </BaristaProvider>
  );
}
