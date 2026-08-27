import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow } from './helpers';

export default function ConfigView() {
  const [medios, setMedios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { id?, nombre, es_virtual }
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const [mResp, rResp] = await Promise.all([
        Api.get('/medios-pago', { per_page: 100 }),
        Api.get('/roles', { per_page: 100 }),
      ]);
      setMedios(Api.unwrapList(mResp).items);
      setRoles(Api.unwrapList(rResp).items);
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
    const body = { nombre: modal.nombre.trim(), es_virtual: modal.es_virtual };
    if (!body.nombre) return alert('Nombre requerido');
    setSaving(true);
    try {
      if (modal.id) await Api.put('/medios-pago/' + modal.id, body);
      else await Api.post('/medios-pago', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este medio de pago?')) return;
    try {
      await Api.delete('/medios-pago/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-credit-card"></i> Medios de Pago</h3>
          <button className="btn-primary" onClick={() => setModal({ id: null, nombre: '', es_virtual: false })}>
            <i className="fa-solid fa-plus"></i> Nuevo Medio
          </button>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>Los medios virtuales exigen comprobante de pago (comprobante_url).</p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Nombre</th><th>Virtual</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={3} text="Cargando…" />
              ) : medios.length === 0 ? (
                <EmptyRow cols={3} text="Sin medios de pago" />
              ) : (
                medios.map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.nombre}</b></td>
                    <td>{m.es_virtual ? <span className="badge badge-info">Virtual (exige comprobante)</span> : <span className="badge badge-success">Físico</span>}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setModal({ id: m.id, nombre: m.nombre, es_virtual: m.es_virtual })}><i className="fa-solid fa-pen-to-square"></i></button>{' '}
                      <button className="btn-icon delete" onClick={() => borrar(m.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="box" style={{ marginTop: '20px' }}>
        <div className="box-top">
          <h3><i className="fa-solid fa-user-shield"></i> Roles del Sistema</h3>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>ID</th><th>Nombre</th></tr></thead>
            <tbody>
              {roles.length === 0 ? (
                <EmptyRow cols={2} text="Sin roles" />
              ) : (
                roles.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><b>{r.nombre}</b></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title={modal.id ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'} onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={modal.nombre} onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={modal.es_virtual} onChange={(e) => setModal((m) => ({ ...m, es_virtual: e.target.checked }))} /> Requiere comprobante de pago
            </label>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
