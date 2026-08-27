import { useEffect, useState } from 'react';
import { Auth } from '../../lib/auth';
import { Api } from '../../lib/api';

export default function InventarioView() {
  const [inventario, setInventario] = useState([]);
  const [reporteModal, setReporteModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/insumos', { per_page: 100 });
      setInventario(Api.unwrapList(resp).items);
    } catch {
      /* se reintenta con polling */
    }
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, []);

  const enviarReporte = async () => {
    if (!reporteModal) return;
    const mensaje = reporteModal.mensaje.trim();
    if (!mensaje) return alert('⚠️ Escribe un mensaje.');

    setSaving(true);
    try {
      await Api.post('/reportes', { mensaje, prioridad: reporteModal.prioridad });
      setReporteModal(null);
      alert('✅ Reporte enviado al administrador.');
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const user = Auth.getCurrentUser();

  return (
    <div className="content-section active" id="inventario">
      <h2 className="section-title">Inventario de Insumos</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Unidad</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((p) => {
              const s = Number(p.stock_actual) || 0;
              const m = Number(p.stock_minimo) || 0;
              let icon, label, cls;
              if (s <= 0) {
                icon = 'fa-solid fa-circle-xmark';
                label = 'Agotado';
                cls = 'stock-out';
              } else if (s <= m) {
                icon = 'fa-solid fa-triangle-exclamation';
                label = 'Bajo';
                cls = 'stock-low';
              } else {
                icon = 'fa-solid fa-circle-check';
                label = 'Disponible';
                cls = 'stock-ok';
              }
              return (
                <tr key={p.id}>
                  <td>
                    <div className="prod-cell">
                      <i className="fa-solid fa-cube"></i> {p.nombre}
                    </div>
                  </td>
                  <td>{p.unidad_medida || '—'}</td>
                  <td><strong>{p.stock_actual}</strong></td>
                  <td>{p.stock_minimo}</td>
                  <td>
                    <span className={`badge-stock ${cls}`}>
                      <i className={icon}></i> {label}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-report"
                      onClick={() =>
                        setReporteModal({
                          producto: p.nombre,
                          mensaje: `Stock bajo: ${p.nombre}`,
                          prioridad: 'alta',
                        })
                      }
                    >
                      <i className="fa-solid fa-flag"></i> Reportar
                    </button>
                  </td>
                </tr>
              );
            })}
            {inventario.length === 0 && (
              <tr>
                <td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                  Sin insumos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {reporteModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setReporteModal(null)}>&times;</button>
            <h2><i className="fa-solid fa-flag"></i> Reportar Novedad</h2>
            <div className="form-group">
              <label>Barista:</label>
              <input type="text" value={user?.nombre || 'Barista'} readOnly />
            </div>
            <div className="form-group">
              <label>Producto:</label>
              <input type="text" value={reporteModal.producto} readOnly />
            </div>
            <div className="form-group">
              <label>Mensaje:</label>
              <textarea rows="3" placeholder="Describe la novedad..." value={reporteModal.mensaje} onChange={(e) => setReporteModal((m) => ({ ...m, mensaje: e.target.value }))}></textarea>
            </div>
            <div className="form-group">
              <label>Prioridad:</label>
              <select value={reporteModal.prioridad} onChange={(e) => setReporteModal((m) => ({ ...m, prioridad: e.target.value }))}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setReporteModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={enviarReporte} disabled={saving}>
                <i className="fa-solid fa-paper-plane"></i> Enviar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
