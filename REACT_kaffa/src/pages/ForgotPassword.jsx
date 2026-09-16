import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isValidEmail } from '../lib/utils';
import { toastSuccess, toastError } from '../lib/toast';

/**
 * Página "Olvidé mi contraseña".
 * El usuario ingresa su correo y el backend le envía un enlace de reseteo.
 * La respuesta es uniforme exista o no el correo (anti-enumeración).
 */
function ForgotPassword() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await Auth.forgotPassword(data.correo.trim());
    setLoading(false);

    if (result.success) {
      setEnviado(true);
      toastSuccess(result.message);
    } else {
      toastError(result.message);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
        <h2>Recuperar contraseña</h2>

        {enviado ? (
          // Estado posterior al envío: confirmación neutra.
          <>
            <p className="text-muted" style={{ textAlign: 'center', margin: '1rem 0' }}>
              Si el correo está registrado, recibirás un enlace para restablecer
              tu contraseña. Revisa tu bandeja de entrada y el spam.
            </p>
            <p className="registro">
              <Link to="/login">Volver a iniciar sesión</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <div className="input-group">
              <label htmlFor="correo">Correo Electrónico</label>
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
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>

            <p className="registro">
              ¿La recordaste? <Link to="/login">Inicia sesión</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
