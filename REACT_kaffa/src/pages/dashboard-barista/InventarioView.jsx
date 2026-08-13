import { useState } from 'react';
import { Auth } from '../../lib/auth';
import { Storage } from '../../lib/storage';

export default function InventarioView() {
  const user = Auth.getCurrentUser();
  const [inventario, setInventario] = useState(() =>
    JSON.parse(localStorage.getItem('inventarioProductos')) || [
      { nombre: 'Café Molido', cat: 'Insumo', cant: 10, und: 'kg' },
      { nombre: 'Leche', cat: 'Insumo', cant: 20, und: 'lt' },
      { nombre: 'Azúcar', cat: 'Insumo', cant: 5, und: 'kg' },
    ],
  );
  const [reporteModal, setReporteModal] = useState(null);

  const enviarReporte = () => {
    if (!reporteModal) return;
    const mensaje = reporteModal.mensaje.trim();
    if (!mensaje) {
      alert('⚠️ Escribe un mensaje.');
      return;
    }
    Storage.addReporte({
      barista: user?.nombre || 'Barista',
      mensaje,
      prioridad: reporteModal.prioridad,
    });
    setReporteModal(null);
    alert('✅ Reporte enviado al administrador.');
  };

  return (
    <div className="content-section active" id="inventario">
      <h2 className="section-title">Inventario de Insumos</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((p) => {
              let icon, label, cls;
              if (p.cant <= 0) {
                icon = 'fa-solid fa-circle-xmark';
                label = 'Agotado';
                cls = 'stock-out';
              } else if (p.cant <= 5) {
                icon = 'fa-solid fa-triangle-exclamation';
                label = 'Bajo';
                cls = 'stock-low';
              } else {
                icon = 'fa-solid fa-circle-check';
                label = 'Disponible';
                cls = 'stock-ok';
              }
              return (
                <tr key={p.nombre}>
                  <td>
                    <div className="prod-cell">
                      <i className="fa-solid fa-cube"></i> {p.nombre}
                    </div>
                  </td>
                  <td>
                    <span className="cat-tag">{p.cat}</span>
                  </td>
                  <td>
                    <strong>{p.cant}</strong> {p.und}
                  </td>
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
                          prioridad: 'Alta',
                        })
                      }
                    >
                      <i className="fa-solid fa-flag"></i> Reportar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {reporteModal && (
        <div className="modal-overlay" style={{ display: 'flex' }} id="modalReporte">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setReporteModal(null)}>
              &times;
            </button>
            <h2>
              <i className="fa-solid fa-flag"></i> Reportar Novedad
            </h2>
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
              <textarea
                rows="3"
                placeholder="Describe la novedad..."
                value={reporteModal.mensaje}
                onChange={(e) => setReporteModal((m) => ({ ...m, mensaje: e.target.value }))}
              ></textarea>
            </div>
            <div className="form-group">
              <label>Prioridad:</label>
              <select
                value={reporteModal.prioridad}
                onChange={(e) => setReporteModal((m) => ({ ...m, prioridad: e.target.value }))}
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setReporteModal(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={enviarReporte}>
                <i className="fa-solid fa-paper-plane"></i> Enviar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
