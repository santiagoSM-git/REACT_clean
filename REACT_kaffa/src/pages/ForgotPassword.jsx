import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isValidEmail } from '../lib/utils';
import { toastSuccess, toastError } from '../lib/toast';

/**
 * Página "Olvidé mi contraseña".
 * El usuario ingresa su correo y el backend le envía un código de 6 dígitos.
 * La respuesta es uniforme exista o no el correo (anti-enumeración).
 */
function ForgotPassword() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    const correo = data.correo.trim();
    setLoading(true);
    const result = await Auth.forgotPassword(correo);
    setLoading(false);

    if (result.success) {
      toastSuccess(result.message);
      // Pasa a la pantalla donde se ingresa el código y la nueva contraseña.
      navigate('/reset-password?correo=' + encodeURIComponent(correo));
    } else {
      toastError(result.message);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
        <h2>Recuperar contraseña</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Ingresa tu correo y te enviaremos un <b>código</b> para restablecer tu contraseña.
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
            {loading ? 'Enviando…' : 'Enviar código'}
          </button>

          <p className="registro">
            ¿La recordaste? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
