import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, badgeActivo, badgeStock } from './helpers';

export default function InsumosView() {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/insumos', { per_page: 100 });
      setInsumos(Api.unwrapList(resp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async () => {
    const body = {
      nombre: modal.nombre.trim(),
      unidad_medida: modal.unidad_medida.trim() || null,
      stock_minimo: Number(modal.stock_minimo) || 0,
      activo: modal.activo,
    };
    if (!modal.id) body.stock_actual = Number(modal.stock_actual) || 0;
    if (!body.nombre) return alert('Nombre requerido');

    setSaving(true);
    try {
      if (modal.id) await Api.put('/insumos/' + modal.id, body);
      else await Api.post('/insumos', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este insumo?')) return;
    try {
      await Api.delete('/insumos/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-boxes-stacked"></i> Inventario de Insumos</h3>
          <button className="btn-primary" onClick={() => setModal({ id: null, nombre: '', unidad_medida: '', stock_actual: 0, stock_minimo: 0, activo: true })}>
            <i className="fa-solid fa-plus"></i> Nuevo Insumo
          </button>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>El stock sube con Compras y baja con Mermas y ventas.</p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Und.</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={8} text="Cargando…" />
              ) : insumos.length === 0 ? (
                <EmptyRow cols={8} text="Sin insumos" />
              ) : (
                insumos.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td><b>{i.nombre}</b></td>
                    <td>{i.unidad_medida || '—'}</td>
                    <td>{i.stock_actual}</td>
                    <td>{i.stock_minimo}</td>
                    <td>{badgeStock(i)}</td>
                    <td>{badgeActivo(i.activo)}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setModal({ id: i.id, nombre: i.nombre, unidad_medida: i.unidad_medida || '', stock_actual: i.stock_actual, stock_minimo: i.stock_minimo, activo: i.activo })}>
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>{' '}
                      <button className="btn-icon delete" onClick={() => borrar(i.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title={modal.id ? 'Editar Insumo' : 'Nuevo Insumo'} onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={modal.nombre} onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Unidad de Medida</label>
              <input type="text" value={modal.unidad_medida} placeholder="kg, lt, unidades" onChange={(e) => setModal((m) => ({ ...m, unidad_medida: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Stock Mínimo</label>
              <input type="number" min="0" step="0.01" value={modal.stock_minimo} onChange={(e) => setModal((m) => ({ ...m, stock_minimo: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Stock Actual {modal.id ? '(se ajusta con compras y mermas)' : '(valor inicial)'}</label>
            <input type="number" min="0" step="0.01" value={modal.stock_actual} disabled={!!modal.id} onChange={(e) => setModal((m) => ({ ...m, stock_actual: e.target.value }))} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={modal.activo} onChange={(e) => setModal((m) => ({ ...m, activo: e.target.checked }))} /> Insumo activo
            </label>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
