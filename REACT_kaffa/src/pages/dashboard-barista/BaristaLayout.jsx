import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStyles } from '../../hooks/useStyles';
import { useDashboardTheme } from '../../hooks/useDashboardTheme';
import { Auth } from '../../lib/auth';
import { Api } from '../../lib/api';
import { BaristaProvider, useBarista } from './BaristaContext.jsx';
import SidebarBarista from './SidebarBarista';

const SECTION_TITLES = {
  pedidos: { icon: 'fa-columns', title: 'Tablero de Pedidos' },
  inventario: { icon: 'fa-boxes-stacked', title: 'Inventario' },
  chat: { icon: 'fa-comments', title: 'Chat Cliente' },
  caja: { icon: 'fa-cash-register', title: 'Caja' },
};

function BaristaLayoutInner() {
  useStyles(['dashboard-base.css', 'dashboard.css']);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useDashboardTheme();
  const { turno, refrescarTurno } = useBarista();

  const [user, setUser] = useState(() => Auth.getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', password: '', avatar: null });
  const [savingProfile, setSavingProfile] = useState(false);
  const profileFileInputRef = useRef(null);

  const sectionKey = pathname.split('/').pop() || 'pedidos';
  const current = SECTION_TITLES[sectionKey] || SECTION_TITLES.pedidos;

  useEffect(() => {
    const u = Auth.getCurrentUser();
    setUser(u);
    setProfile({ name: u?.nombre || '', email: u?.correo || '', password: '', avatar: u?.avatar || null });
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.profile-trigger')) setDropdownOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

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
    if (window.confirm('¿Cerrar sesión?')) {
      await Auth.logout();
      navigate('/login');
    }
  };

  const profileAvatar =
    profile.avatar ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nombre || 'Barista')}&background=293f2c&color=fff`;

  const turnoActivo = turno?.turno_activo && turno?.turno_info;

  return (
    <>
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* CONTENEDOR PRINCIPAL */}
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
              <span className={`turno-badge ${turnoActivo ? 'activo' : 'cerrado'}`} style={{ marginRight: '10px' }}>
                <i className="fa-solid fa-circle"></i>{' '}
                {turnoActivo
                  ? `TURNO ${turno.turno_info.tipo.toUpperCase()} · ${turno.turno_info.minutos_restantes} min`
                  : 'SIN TURNO ACTIVO'}
              </span>
              <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <div className="profile-trigger" onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v); }}>
                <img src={profileAvatar} className="profile-avatar" alt="Perfil" />
                <div className="profile-info">
                  <div className="profile-name">{user?.nombre || 'Barista'}</div>
                  <div className="profile-role">Barista</div>
                </div>
                <i className="fa-solid fa-caret-down" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                <div className={`profile-dropdown${dropdownOpen ? ' show' : ''}`}>
                  <div className="dropdown-item" onClick={openProfile}>
                    <i className="fa-solid fa-user-pen"></i> Editar Perfil
                  </div>
                  <div className="dropdown-item logout" onClick={logout}>
                    <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Outlet context={{ refrescarTurno }} />
        </main>
      </div>

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
