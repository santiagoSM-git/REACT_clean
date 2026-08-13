import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isValidEmail } from '../lib/utils';

function Registro() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = (data) => {
    const nombre = data.nombre.trim();
    const usuario = data.usuario.trim();
    const email = data.email.trim();
    const password = data.password.trim();
    const confirmar = data.confirmar.trim();

    if (!nombre || !usuario || !email || !password || !confirmar) {
      alert('⚠️ Por favor completa todos los campos.');
      return;
    }
    if (password !== confirmar) {
      alert('❌ Las contraseñas no coinciden. Por favor verifica.');
      return;
    }
    if (password.length < 6) {
      alert('❌ La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!isValidEmail(email)) {
      alert('❌ Por favor ingresa un correo electrónico válido.');
      return;
    }

    const result = Auth.register({ nombre, username: usuario, email, password });
    alert(result.message);

    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="container_dos">
      <div className="login-box">
        <img className="imagen" src="/imagenes/logo_kaffa.jpg" alt="KAFFA logo" />
        <h2>Registrarse</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              placeholder="Tu nombre completo"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            {errors.nombre && <span className="auth-error">{errors.nombre.message}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="usuario">Nombre de Usuario</label>
            <input
              type="text"
              id="usuario"
              placeholder="Elige un nombre de usuario"
              {...register('usuario', { required: 'El usuario es obligatorio' })}
            />
            {errors.usuario && <span className="auth-error">{errors.usuario.message}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="ejemplo@correo.com"
              {...register('email', {
                required: 'El correo es obligatorio',
                validate: (v) => isValidEmail(v) || 'Ingresa un correo válido',
              })}
            />
            {errors.email && <span className="auth-error">{errors.email.message}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Crea una contraseña"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                id="togglePassword"
                onClick={() => setShowPassword((v) => !v)}
              ></i>
            </div>
            {errors.password && <span className="auth-error">{errors.password.message}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="confirmar">Confirmar Contraseña</label>
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

          <button type="submit" className="btn">
            Registrarme
          </button>
        </form>
        <p className="registro">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;
