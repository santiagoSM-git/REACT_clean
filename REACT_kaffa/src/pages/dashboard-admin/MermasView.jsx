import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, fechaStr } from './helpers';

export default function MermasView() {
  const [mermas, setMermas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const [mResp, iResp] = await Promise.all([
        Api.get('/mermas', { per_page: 100 }),
        Api.get('/insumos', { per_page: 100 }),
      ]);
      setMermas(Api.unwrapList(mResp).items);
      setInsumos(Api.unwrapList(iResp).items);
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
      insumo_id: Number(modal.insumo_id),
      cantidad: Number(modal.cantidad),
      motivo: modal.motivo.trim() || null,
    };
    if (!body.insumo_id || !(body.cantidad > 0)) return alert('Completa insumo y cantidad');

    setSaving(true);
    try {
      await Api.post('/mermas', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar esta merma? (el stock se restaura)')) return;
    try {
      await Api.delete('/mermas/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-trash-arrow-up"></i> Mermas</h3>
          <button className="btn-primary" onClick={() => setModal({ insumo_id: insumos[0]?.id || '', cantidad: '', motivo: '' })}>
            <i className="fa-solid fa-plus"></i> Registrar Merma
          </button>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Insumo</th><th>Cantidad</th><th>Motivo</th><th>Registrada por</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={6} text="Cargando…" />
              ) : mermas.length === 0 ? (
                <EmptyRow cols={6} text="Sin mermas" />
              ) : (
                mermas.map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.insumo?.nombre || '—'}</b></td>
                    <td>{m.cantidad}</td>
                    <td>{m.motivo || '—'}</td>
                    <td>{m.usuario?.nombre || '—'}</td>
                    <td>{fechaStr(m.created_at)}</td>
                    <td><button className="btn-icon delete" onClick={() => borrar(m.id)}><i className="fa-solid fa-trash-can"></i></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title="Registrar Merma" onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Insumo</label>
            <select value={modal.insumo_id} onChange={(e) => setModal((m) => ({ ...m, insumo_id: e.target.value }))}>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre} (stock {i.stock_actual})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cantidad</label>
            <input type="number" min="0.01" step="0.01" value={modal.cantidad} onChange={(e) => setModal((m) => ({ ...m, cantidad: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Motivo</label>
            <textarea rows="2" placeholder="Ej. producto vencido, derrame..." value={modal.motivo} onChange={(e) => setModal((m) => ({ ...m, motivo: e.target.value }))}></textarea>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
