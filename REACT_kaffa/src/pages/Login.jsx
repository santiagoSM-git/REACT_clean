import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isNotEmpty } from '../lib/utils';

function Login() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = (data) => {
    const user = data.user.trim();
    const password = data.password.trim();

    if (!isNotEmpty(user) || !isNotEmpty(password)) {
      alert('⚠️ Por favor completa todos los campos.');
      return;
    }

    const result = Auth.login(user, password);
    alert(result.message);

    if (result.success && result.redirect) {
      navigate(result.redirect);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
        <h2>Inicia Sesión</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label htmlFor="user">Usuario</label>
            <input
              type="text"
              id="user"
              placeholder="Tu nombre de usuario"
              {...register('user', { required: 'El usuario es obligatorio' })}
            />
            {errors.user && <span className="auth-error">{errors.user.message}</span>}
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

          <button type="submit" className="btn">
            Ingresar
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
