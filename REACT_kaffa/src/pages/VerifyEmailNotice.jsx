import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isValidEmail } from '../lib/utils';
import { toastSuccess, toastError } from '../lib/toast';

/**
 * Aviso de "verifica tu correo".
 * Se muestra tras el registro y cuando el login rechaza por EMAIL_NOT_VERIFIED.
 * Permite reenviar el correo de verificación.
 */
function VerifyEmailNotice() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const [searchParams] = useSearchParams();
  const correoInicial = searchParams.get('correo') || '';

  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur', defaultValues: { correo: correoInicial } });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await Auth.resendVerification(data.correo.trim());
    setLoading(false);

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
          Te enviamos un enlace de verificación a tu correo electrónico.
          Debes confirmarlo antes de poder iniciar sesión. Revisa también el spam.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label htmlFor="correo">¿No te llegó? Reenviar a:</label>
            <input
              type="text"
              id="correo"
              placeholder="ejemplo@correo.com"
              {...register('correo', {
                required: 'El correo es obligatorio',
                validate: (v) => isValidEmail(v) || 'Ingresa un correo válido',
              })}
            />
            {errors.correo && <span className="auth-error">{errors.correo.message}</span>}
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Reenviando…' : 'Reenviar correo de verificación'}
          </button>
        </form>

        <p className="registro">
          ¿Ya verificaste? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailNotice;
