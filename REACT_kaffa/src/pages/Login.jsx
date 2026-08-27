import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isValidEmail } from '../lib/utils';

function Login() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    const correo = data.correo.trim();
    const password = data.password.trim();

    if (!correo || !password) {
      setFeedback('⚠️ Por favor completa todos los campos.');
      return;
    }

    setFeedback('');
    setLoading(true);
    const result = await Auth.login(correo, password);
    setLoading(false);

    if (result.success) {
      navigate(result.redirect);
    } else {
      setFeedback(result.message);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
        <h2>Inicia Sesión</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
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

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                {...register('password', { required: 'La contraseña es obligatoria' })}
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                id="togglePassword"
                onClick={() => setShowPassword((v) => !v)}
              ></i>
            </div>
            {errors.password && <span className="auth-error">{errors.password.message}</span>}
          </div>

          {feedback && <p className="login-feedback">{feedback}</p>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="registro">
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
