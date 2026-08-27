import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';
import { Auth } from '../lib/auth';
import { isValidEmail } from '../lib/utils';

/** Reglas de contraseña del backend (min 8, mayúscula, minúscula, número, símbolo). */
function validarPassword(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir una mayúscula.';
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir una minúscula.';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir un número.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe incluir un símbolo (ej. !@#$%).';
  return null;
}

function Registro() {
  useStyles(['style.css', 'auth.css']);
  useBodyClass('login-page');

  const navigate = useNavigate();
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
    setLoading(true);
    const result = await Auth.register({
      nombre: data.nombre.trim(),
      correo: data.email.trim(),
      password: data.password,
    });
    setLoading(false);

    if (result.success) {
      alert(result.message);
      navigate(result.redirect);
    } else {
      alert(result.message);
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

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Registrando…' : 'Registrarme'}
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
