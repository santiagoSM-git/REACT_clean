import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import RequireRole from './components/RequireRole';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Eventos from './pages/Eventos';
import SobreNosotros from './pages/SobreNosotros';
import Contacto from './pages/Contacto';
import Login from './pages/Login';
import Registro from './pages/Registro';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmailNotice from './pages/VerifyEmailNotice';
import MisPedidos from './pages/MisPedidos';
import ChatBarista from './pages/ChatBarista';
import DashboardAdmin from './pages/dashboard-admin/DashboardAdmin';
import BaristaLayout from './pages/dashboard-barista/BaristaLayout';
import PedidosView from './pages/dashboard-barista/PedidosView';
import InventarioView from './pages/dashboard-barista/InventarioView';
import ChatView from './pages/dashboard-barista/ChatView';
import CajaView from './pages/dashboard-barista/CajaView';

function App() {
  return (
    // ErrorBoundary: captura errores de render no controlados en toda la app.
    <ErrorBoundary>
      {/* Toaster: contenedor global de notificaciones (sonner). */}
      <Toaster position="top-right" richColors closeButton />
      <Routes>
      {/* Páginas públicas dentro del Layout (navbar + footer) */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="eventos" element={<Eventos />} />
        <Route path="sobre-nosotros" element={<SobreNosotros />} />
        <Route path="contacto" element={<Contacto />} />
        {/* Funcionalidades del cliente: mismo sitio, mismas rutas públicas */}
        <Route
          path="pedidos"
          element={
            <RequireRole role="cliente">
              <MisPedidos />
            </RequireRole>
          }
        />
        <Route
          path="chat"
          element={
            <RequireRole role="cliente">
              <ChatBarista />
            </RequireRole>
          }
        />
      </Route>

      {/* Auth standalone (sin navbar ni footer) */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      {/* Recuperación de contraseña y verificación de correo */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmailNotice />} />

      {/* Dashboards protegidos por rol */}
      <Route
        path="/admin-dashboard"
        element={
          <RequireRole role="admin">
            <DashboardAdmin />
          </RequireRole>
        }
      />

      {/* Panel de Barista: Layout con sidebar + contenido (Outlet) */}
      <Route
        path="/barista-dashboard"
        element={
          <RequireRole role="barista">
            <BaristaLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<PedidosView />} />
        <Route path="inventario" element={<InventarioView />} />
        <Route path="chat" element={<ChatView />} />
        <Route path="caja" element={<CajaView />} />
      </Route>

      {/* Cualquier ruta desconocida vuelve al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
