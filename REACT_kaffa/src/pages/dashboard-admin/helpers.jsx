/* eslint-disable react-refresh/only-export-components */
/**
 * KAFFA Admin - Helpers compartidos de vistas
 */
import { Api } from '../../lib/api';
import { TURNOS_LABEL } from '../../lib/turnos';

export { turnoLabel, turnoCorto } from '../../lib/turnos';

export const TIPOS_TURNO = TURNOS_LABEL;

export const ESTADOS = {
  pendiente: { label: 'Pendiente', cls: 'badge-warning' },
  pagado: { label: 'Pagado', cls: 'badge-info' },
  cancelado: { label: 'Cancelado', cls: 'badge-danger' },
  entregado: { label: 'Entregado', cls: 'badge-success' },
};

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

/**
 * Sube la imagen del comprobante desde el dispositivo (PC/móvil) y devuelve
 * la URL pública que el backend persiste en `comprobante_url`.
 */
export async function subirComprobante(file) {
  const fd = new FormData();
  fd.append('imagen', file);
  const resp = await Api.post('/comprobantes', fd);
  return resp?.url || Api.unwrapOne(resp)?.url || '';
}

/** Sube la imagen de un evento y devuelve la URL pública a persistir. */
export async function subirImagenEvento(file) {
  const fd = new FormData();
  fd.append('imagen', file);
  const resp = await Api.post('/eventos/imagen', fd);
  return resp?.url || Api.unwrapOne(resp)?.url || '';
}

/** Botón para subir la imagen del comprobante con su vista previa. */
export function ComprobanteUpload({ url, subiendo = false, onFile, label = 'Comprobante' }) {
  return (
    <>
      <label
        className="btn-secondary comprobante-upload"
        style={{ margin: 0, cursor: subiendo ? 'progress' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}
      >
        <i className="fa-solid fa-upload"></i>
        {subiendo ? 'Subiendo…' : url ? 'Comprobante ✓' : label}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={subiendo}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />
      </label>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" title="Ver comprobante" style={{ marginLeft: '6px' }}>
          <i className="fa-solid fa-image"></i>
        </a>
      )}
    </>
  );
}
