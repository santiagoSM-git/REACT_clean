const PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

export function formatearPrecioMenu(valor) {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^\d.-]/g, ''));
  return `$${(Number.isNaN(n) ? 0 : n).toLocaleString('es-CO')}`;
}

export function obtenerPedidos() {
  return JSON.parse(localStorage.getItem('kaffaOrders')) || [];
}

export function guardarPedidos(pedidos) {
  localStorage.setItem('kaffaOrders', JSON.stringify(pedidos));
}

export function leerNotificaciones() {
  return JSON.parse(localStorage.getItem('kaffaNotificaciones')) || [];
}

export function esPersonalizado(pedido) {
  if (pedido.items && Array.isArray(pedido.items)) {
    return pedido.items.some((item) => {
      if (typeof item === 'string') return item.includes('(') && item.includes(')');
      return (
        item.personalizacion &&
        (item.personalizacion.extras?.length > 0 ||
          item.personalizacion.leche ||
          item.personalizacion.tamano)
      );
    });
  }
  return false;
}

export function obtenerPersonalizaciones(pedido) {
  const personalizaciones = [];
  if (pedido.items && Array.isArray(pedido.items)) {
    pedido.items.forEach((item) => {
      if (typeof item === 'string' && item.includes('(')) {
        personalizaciones.push(item);
      } else if (item.personalizacion) {
        let desc = item.producto?.nombre || 'Producto';
        if (item.personalizacion.tamano) desc += ` - ${item.personalizacion.tamano.nombre}`;
        if (item.personalizacion.leche) desc += ` - ${item.personalizacion.leche}`;
        if (item.personalizacion.extras?.length > 0) {
          desc += ` - Extras: ${item.personalizacion.extras.map((e) => e.nombre).join(', ')}`;
        }
        personalizaciones.push(desc);
      }
    });
  }
  return personalizaciones;
}

export function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}

export function avatarLetra(nombre) {
  return (nombre || '?').charAt(0).toUpperCase();
}

export function getJsPDF() {
  return new Promise((resolve) => {
    if (window.jspdf) return resolve(window.jspdf.jsPDF);
    const script = document.createElement('script');
    script.src = PDF_CDN;
    script.async = true;
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = () => {
      alert('No se pudo cargar el generador de PDF.');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}
