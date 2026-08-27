import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, badgeActivo } from './helpers';

export default function ProveedoresView() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/proveedores', { per_page: 100 });
      setProveedores(Api.unwrapList(resp).items);
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
      nit: modal.nit.trim(),
      nombre: modal.nombre.trim(),
      telefono: modal.telefono.trim() || null,
      correo: modal.correo.trim() || null,
      direccion: modal.direccion.trim() || null,
      activo: modal.activo,
    };
    if (!body.nit || !body.nombre) return alert('NIT y nombre requeridos');

    setSaving(true);
    try {
      if (modal.id) await Api.put('/proveedores/' + modal.id, body);
      else await Api.post('/proveedores', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;
    try {
      await Api.delete('/proveedores/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-truck-field"></i> Proveedores</h3>
          <button className="btn-primary" onClick={() => setModal({ id: null, nit: '', nombre: '', telefono: '', correo: '', direccion: '', activo: true })}>
            <i className="fa-solid fa-plus"></i> Nuevo Proveedor
          </button>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>NIT</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={6} text="Cargando…" />
              ) : proveedores.length === 0 ? (
                <EmptyRow cols={6} text="Sin proveedores" />
              ) : (
                proveedores.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.nit}</code></td>
                    <td><b>{p.nombre}</b></td>
                    <td>{p.telefono || '—'}</td>
                    <td>{p.correo || '—'}</td>
                    <td>{badgeActivo(p.activo)}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setModal({ id: p.id, nit: p.nit, nombre: p.nombre, telefono: p.telefono || '', correo: p.correo || '', direccion: p.direccion || '', activo: p.activo })}>
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>{' '}
                      <button className="btn-icon delete" onClick={() => borrar(p.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title={modal.id ? 'Editar Proveedor' : 'Nuevo Proveedor'} onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>NIT</label>
            <input type="text" value={modal.nit} onChange={(e) => setModal((m) => ({ ...m, nit: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={modal.nombre} onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" value={modal.telefono} onChange={(e) => setModal((m) => ({ ...m, telefono: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input type="email" value={modal.correo} onChange={(e) => setModal((m) => ({ ...m, correo: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" value={modal.direccion} onChange={(e) => setModal((m) => ({ ...m, direccion: e.target.value }))} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={modal.activo} onChange={(e) => setModal((m) => ({ ...m, activo: e.target.checked }))} /> Proveedor activo
            </label>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
