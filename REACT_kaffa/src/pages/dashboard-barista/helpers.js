const PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

export function formatearPrecioMenu(valor) {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^\d.-]/g, ''));
  return `$${(Number.isNaN(n) ? 0 : n).toLocaleString('es-CO')}`;
}

export function money(v) {
  const n = Number(v) || 0;
  return '$' + n.toLocaleString('es-CO');
}

export function fechaHora(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString('es-CO') + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export function itemsPedido(p) {
  return (p.detalles || []).map((d) => ({
    nombre: d.producto?.nombre || 'Producto',
    cant: Number(d.cantidad) || 1,
  }));
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
