import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isValidEmail } from '../lib/utils';
import { toastSuccess, toastError } from '../lib/toast';

/** Segundos de espera entre reenvíos (espejo de config/otp.php). */
const REENVIO_SEGUNDOS = 60;

/**
 * Verificación de correo por código OTP.
 * Se muestra tras el registro y cuando el login rechaza por EMAIL_NOT_VERIFIED.
 * Permite reenviar el código (con cuenta regresiva).
 */
function VerifyEmailNotice() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [correo, setCorreo] = useState(searchParams.get('correo') || '');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(searchParams.get('correo') ? REENVIO_SEGUNDOS : 0);

  // Cuenta regresiva del reenvío.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onVerificar = async (e) => {
    e.preventDefault();
    const mail = correo.trim();
    if (!isValidEmail(mail)) return toastError('Ingresa un correo válido.');
    if (!/^\d{6}$/.test(codigo)) return toastError('El código debe tener 6 dígitos.');

    setLoading(true);
    const result = await Auth.verifyCode(mail, codigo);
    setLoading(false);

    if (result.success) {
      toastSuccess(result.message);
      navigate('/login?verified=1');
    } else {
      toastError(result.message);
    }
  };

  const onReenviar = async () => {
    const mail = correo.trim();
    if (!isValidEmail(mail)) return toastError('Ingresa un correo válido.');

    setCooldown(REENVIO_SEGUNDOS);
    const result = await Auth.resendVerification(mail);
    if (result.success) {
      toastSuccess(result.message);
    } else {
      toastError(result.message);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
        <h2>Verifica tu correo</h2>

        <p className="text-muted" style={{ textAlign: 'center', margin: '1rem 0' }}>
          Te enviamos un <b>código de 6 dígitos</b> a tu correo electrónico.
          Ingrésalo para activar tu cuenta. Revisa también el spam.
        </p>

        <form onSubmit={onVerificar}>
          <div className="input-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              type="text"
              id="correo"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="codigo">Código de verificación</label>
            <input
              type="text"
              id="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              autoFocus
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 600 }}
            />
          </div>

          <button type="submit" className="btn" disabled={loading || codigo.length !== 6}>
            {loading ? 'Verificando…' : 'Verificar cuenta'}
          </button>
        </form>

        <p className="registro" style={{ marginTop: '1rem' }}>
          ¿No te llegó?{' '}
          <button
            type="button"
            onClick={onReenviar}
            disabled={cooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              textDecoration: 'underline',
              cursor: cooldown > 0 ? 'default' : 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
          </button>
        </p>

        <p className="registro">
          ¿Ya verificaste? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailNotice;
