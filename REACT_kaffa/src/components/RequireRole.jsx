/**
 * KAFFA - Guard de rutas por rol
 * Valida el token contra GET /me; mientras carga muestra un spinner y
 * si falla redirige a /login (o a / si el rol no corresponde).
 */
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Auth } from '../lib/auth';

export default function RequireRole({ role, children }) {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error

  useEffect(() => {
    let activo = true;
    Auth.requireAuth(role).then((user) => {
      if (!activo) return;
      if (user) {
        setEstado('ok');
      } else {
        setEstado('error');
      }
    });
    return () => {
      activo = false;
    };
  }, [role]);

  useEffect(() => {
    if (estado === 'error') {
      if (!Auth.isLoggedIn()) {
        navigate('/login', { replace: true });
      } else {
        alert('⚠️ No tienes permiso para acceder a esta página.');
        navigate('/', { replace: true });
      }
    }
  }, [estado, navigate]);

  if (estado === 'cargando') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', fontFamily: 'Poppins, sans-serif' }}>
        <img src="/imagenes/logo_kaffa.jpg" alt="KAFFA" style={{ width: '64px', borderRadius: '12px' }} />
        <p style={{ color: 'var(--text-muted, #888)' }}>Verificando sesión…</p>
      </div>
    );
  }

  if (estado === 'error') return <Navigate to="/login" replace />;

  return children;
}
