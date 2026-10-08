import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { toastSuccess, toastError } from '../lib/toast';

/** Mismas reglas de contraseña que el backend (min 8, mayús., minús., número, símbolo). */
function validarPassword(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir una mayúscula.';
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir una minúscula.';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir un número.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe incluir un símbolo (ej. !@#$%).';
  return null;
}

/**
 * Página de restablecimiento de contraseña por código.
 * Llega desde "Olvidé mi contraseña" con ?correo=... en la URL.
 */
function ResetPassword() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const correo = searchParams.get('correo') || '';

  const [codigo, setCodigo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    if (!/^\d{6}$/.test(codigo)) return toastError('El código debe tener 6 dígitos.');

    setLoading(true);
    const result = await Auth.resetPassword({
      correo,
      codigo,
      password: data.password,
      password_confirmation: data.confirmar,
    });
    setLoading(false);

    if (result.success) {
      toastSuccess(result.message);
      navigate('/login');
    } else {
      toastError(result.message);
    }
  };

  // Sin correo no se puede continuar: hay que solicitarlo de nuevo.
  if (!correo) {
    return (
      <div className="container">
        <div className="login-box">
          <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
          <h2>Falta el correo</h2>
          <p className="text-muted" style={{ textAlign: 'center', margin: '1rem 0' }}>
            No sabemos a qué correo enviar el código. Solicítalo de nuevo.
          </p>
          <p className="registro">
            <Link to="/forgot-password">Solicitar código</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="login-box">
        <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
        <h2>Nueva contraseña</h2>

        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Ingresa el <b>código de 6 dígitos</b> que enviamos a <b>{correo}</b> y tu nueva contraseña.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
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

          <div className="input-group">
            <label htmlFor="password">Nueva contraseña</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Crea una contraseña"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  validate: (v) => validarPassword(v) || true,
                })}
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                id="togglePassword"
                onClick={() => setShowPassword((v) => !v)}
              ></i>
            </div>
            {errors.password && <span className="auth-error">{errors.password.message}</span>}
            <small className="text-muted">Mín. 8 caracteres: mayúscula, minúscula, número y símbolo.</small>
          </div>

          <div className="input-group">
            <label htmlFor="confirmar">Confirmar contraseña</label>
            <div className="password-wrapper">
              <input
                type={showConfirmar ? 'text' : 'password'}
                id="confirmar"
                placeholder="Repite la contraseña"
                {...register('confirmar', {
                  required: 'Confirma tu contraseña',
                  validate: (v) => v === getValues('password') || 'Las contraseñas no coinciden',
                })}
              />
              <i
                className={`fa-solid ${showConfirmar ? 'fa-eye-slash' : 'fa-eye'}`}
                id="toggleConfirmar"
                onClick={() => setShowConfirmar((v) => !v)}
              ></i>
            </div>
            {errors.confirmar && <span className="auth-error">{errors.confirmar.message}</span>}
          </div>

          <button type="submit" className="btn" disabled={loading || codigo.length !== 6}>
            {loading ? 'Guardando…' : 'Restablecer contraseña'}
          </button>
        </form>

        <p className="registro">
          ¿No recibiste el código? <Link to="/forgot-password">Solicitar otro</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
