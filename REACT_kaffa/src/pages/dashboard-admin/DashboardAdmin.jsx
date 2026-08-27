import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../../hooks/useStyles';
import { useDashboardTheme } from '../../hooks/useDashboardTheme';
import { Auth } from '../../lib/auth';
import { Api } from '../../lib/api';
import InicioView from './InicioView';
import PedidosView from './PedidosView';
import ProductosView from './ProductosView';
import CategoriasView from './CategoriasView';
import InsumosView from './InsumosView';
import MermasView from './MermasView';
import ComprasView from './ComprasView';
import ProveedoresView from './ProveedoresView';
import GastosView from './GastosView';
import CajasView from './CajasView';
import FacturasView from './FacturasView';
import ClientesView from './ClientesView';
import BaristasView from './BaristasView';
import TurnosView from './TurnosView';
import ReportesView from './ReportesView';
import ConfigView from './ConfigView';

const NAV = [
  { id: 'inicio', icon: 'fa-house', label: 'Inicio' },
  { id: 'pedidos', icon: 'fa-clipboard-list', label: 'Pedidos' },
  { id: 'productos', icon: 'fa-mug-hot', label: 'Menú / Productos' },
  { id: 'categorias', icon: 'fa-tags', label: 'Categorías' },
  { id: 'inventario', icon: 'fa-boxes-stacked', label: 'Insumos' },
  { id: 'mermas', icon: 'fa-trash-arrow-up', label: 'Mermas' },
  { id: 'compras', icon: 'fa-truck-ramp-box', label: 'Compras' },
  { id: 'proveedores', icon: 'fa-truck-field', label: 'Proveedores' },
  { id: 'gastos', icon: 'fa-money-bill-transfer', label: 'Gastos' },
  { id: 'cajas', icon: 'fa-cash-register', label: 'Cajas' },
  { id: 'facturas', icon: 'fa-file-invoice', label: 'Facturas' },
  { id: 'clientes', icon: 'fa-user', label: 'Clientes' },
  { id: 'baristas', icon: 'fa-users', label: 'Baristas' },
  { id: 'turnos', icon: 'fa-clock', label: 'Turnos' },
  { id: 'reportes', icon: 'fa-flag', label: 'Reportes' },
  { id: 'config', icon: 'fa-gear', label: 'Configuración' },
];

const VIEWS = {
  inicio: InicioView,
  pedidos: PedidosView,
  productos: ProductosView,
  categorias: CategoriasView,
  inventario: InsumosView,
  mermas: MermasView,
  compras: ComprasView,
  proveedores: ProveedoresView,
  gastos: GastosView,
  cajas: CajasView,
  facturas: FacturasView,
  clientes: ClientesView,
  baristas: BaristasView,
  turnos: TurnosView,
  reportes: ReportesView,
  config: ConfigView,
};

function DashboardAdmin() {
  useStyles(['dashboard-base.css', 'dashboard-admin.css']);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDashboardTheme();

  const [user, setUser] = useState(() => Auth.getCurrentUser());
  const [section, setSection] = useState('inicio');
  const [sideOpen, setSideOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', password: '', avatar: null });
  const [savingProfile, setSavingProfile] = useState(false);
  const profileFileInputRef = useRef(null);

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
    if (window.confirm('¿Salir del sistema?')) {
      await Auth.logout();
      navigate('/login');
    }
  };

  const profileAvatar =
    profile.avatar ||
    user?.avatar ||
    'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.nombre || 'Admin') + '&background=293f2c&color=fff&size=40';

  const Vista = VIEWS[section] || InicioView;

  return (
    <>
      <div className={`sidebar-overlay${sideOpen ? ' open' : ''}`} onClick={() => setSideOpen(false)}></div>

      <div className="app">
        {/* SIDEBAR */}
        <aside className={`sidebar${sideOpen ? ' open' : ''}`}>
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
                  onClick={() => setSection(item.id)}
                >
                  <i className={`fa-solid ${item.icon}`}></i> {item.label}
                </button>
              ))}
            </nav>
            <div className="sidebar-divider"></div>
            <nav className="sidebar-auth">
              <button className="sidebar-link" onClick={logout}>
                <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
              </button>
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="main">
          <header className="topbar">
            <button className="sidebar-toggle" onClick={() => setSideOpen((v) => !v)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <h1 className="page-title">{NAV.find((n) => n.id === section)?.label || 'Dashboard'}</h1>
            <div className="topbar-right">
              <div className="profile-wrap">
                <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                  <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                <div className="profile-trigger" onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v); }}>
                  <img src={profileAvatar} className="profile-avatar" alt="Perfil" />
                  <div className="profile-info">
                    <div className="profile-name">{user?.nombre || 'Admin'}</div>
                    <div className="profile-role">Administrador</div>
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
          </header>

          <div className="content">
            <Vista />
          </div>
        </div>
      </div>

      {/* MODAL PERFIL */}
      {profileOpen && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setProfileOpen(false)}>&times;</button>
            <h2><i className="fa-solid fa-user-gear"></i> Mi Perfil</h2>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <img src={profileAvatar} className="profile-modal-avatar" alt="Perfil" />
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

export default DashboardAdmin;
