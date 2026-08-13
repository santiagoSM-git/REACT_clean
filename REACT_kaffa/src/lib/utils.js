/**
 * KAFFA - Utilidades compartidas
 * Funciones reutilizables en toda la aplicación (portadas desde js/utils.js)
 */

/** Formatea un número como moneda colombiana. Ej: "$12,000" */
export const formatCurrency = (amount) => `$${Number(amount).toLocaleString('es-CO')}`;

/** Formatea una fecha ISO a formato local. Ej: "16/12/2025" */
export const formatDate = (isoDate) => new Date(isoDate).toLocaleDateString('es-ES');

/** Formatea fecha y hora. Ej: "16/12/2025 14:30" */
export const formatDateTime = (isoDate) => {
  const fecha = new Date(isoDate);
  return (
    fecha.toLocaleDateString('es-ES') +
    ' ' +
    fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  );
};

/** Genera un ID único basado en timestamp. Ej: "PED-1702756555123" */
export const generateId = (prefix = 'ID') => `${prefix}-${Date.now()}`;

/** Genera un usuario a partir del nombre. Ej: "user_juan42" */
export const generateUsername = (nombre) => {
  const base = nombre.split(' ')[0].toLowerCase();
  const random = Math.floor(Math.random() * 100);
  return `user_${base}${random}`;
};

/** Genera una contraseña aleatoria */
export const generatePassword = (length = 6) => Math.random().toString(36).slice(-length);

/** Valida formato de email */
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Valida que un string no esté vacío */
export const isNotEmpty = (str) => str && str.trim().length > 0;

/** Alterna la visibilidad de un campo password (por id) */
export const togglePasswordVisibility = (inputId, iconId = null) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
  if (iconId) {
    const icon = document.getElementById(iconId);
    if (icon) icon.classList.toggle('fa-eye-slash');
  }
};

/** Muestra una notificación flotante (toast) */
export const showToast = (mensaje, tipo = 'info') => {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 15px 25px;
    border-radius: 10px; color: white; font-weight: 500; z-index: 99999;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  `;
  if (tipo === 'success') div.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
  else if (tipo === 'error') div.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
  else div.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';

  div.textContent = mensaje;
  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => div.remove(), 300);
  }, 4000);
};
