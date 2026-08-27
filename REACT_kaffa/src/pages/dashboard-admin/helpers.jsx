/* eslint-disable react-refresh/only-export-components */
/**
 * KAFFA Admin - Helpers compartidos de vistas
 */

export const ESTADOS = {
  pendiente: { label: 'Pendiente', cls: 'badge-warning' },
  pagado: { label: 'Pagado', cls: 'badge-info' },
  cancelado: { label: 'Cancelado', cls: 'badge-danger' },
  entregado: { label: 'Entregado', cls: 'badge-success' },
};

export const TIPOS_TURNO = { mañana: 'Mañana (07:00 - 13:00)', tarde: 'Tarde (13:00 - 18:00)' };

export function money(v) {
  const n = Number(v) || 0;
  return '$' + n.toLocaleString('es-CO');
}

export function fechaStr(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString('es-CO') + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export function soloFecha(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-CO');
}

export function badgeEstadoPedido(estado) {
  const st = ESTADOS[estado] || ESTADOS.pendiente;
  return <span className={`badge ${st.cls}`}>{st.label}</span>;
}

export function badgeActivo(activo) {
  return activo ? <span className="badge badge-success">Activo</span> : <span className="badge badge-danger">Inactivo</span>;
}

export function badgeStock(insumo) {
  const s = Number(insumo.stock_actual) || 0;
  const m = Number(insumo.stock_minimo) || 0;
  if (s <= 0) return <span className="badge badge-danger">Agotado</span>;
  if (s <= m) return <span className="badge badge-warning">Bajo</span>;
  return <span className="badge badge-success">Disponible</span>;
}

/** Fila vacía para tablas */
export function EmptyRow({ cols, text = 'Sin registros' }) {
  return (
    <tr>
      <td colSpan={cols}>
        <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>{text}</p>
      </td>
    </tr>
  );
}
