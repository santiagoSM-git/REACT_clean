import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, badgeActivo, fechaStr } from './helpers';

export default function BaristasView() {
  const [baristas, setBaristas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { id?, nombre, correo, password, activo }
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/usuarios', { rol: 'barista', per_page: 100 });
      setBaristas(Api.unwrapList(resp).items);
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
      correo: modal.correo.trim(),
      activo: modal.activo,
    };
    if (!body.nombre || !body.correo) return alert('Nombre y correo requeridos');

    if (!modal.id) {
      if (!modal.password) return alert('La contraseña es requerida');
      body.password = modal.password;
    } else if (modal.password) {
      body.password = modal.password;
    }

    setSaving(true);
    try {
      if (modal.id) await Api.put('/usuarios/' + modal.id, body);
      else {
        // Asignar el rol barista al crear
        const rolesResp = await Api.get('/roles', { per_page: 100 });
        const roles = Api.unwrapList(rolesResp).items;
        const rolBarista = roles.find((r) => r.nombre === 'barista');
        body.rol_ids = rolBarista ? [rolBarista.id] : [];
        await Api.post('/usuarios', body);
      }
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este barista?')) return;
    try {
      await Api.delete('/usuarios/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-users"></i> Baristas</h3>
          <button className="btn-primary" onClick={() => setModal({ id: null, nombre: '', correo: '', password: '', activo: true })}>
            <i className="fa-solid fa-plus"></i> Agregar Barista
          </button>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Registro</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={5} text="Cargando…" />
              ) : baristas.length === 0 ? (
                <EmptyRow cols={5} text="Sin baristas" />
              ) : (
                baristas.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.nombre}</b></td>
                    <td>{b.correo}</td>
                    <td>{fechaStr(b.created_at)}</td>
                    <td>{badgeActivo(b.activo)}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setModal({ id: b.id, nombre: b.nombre, correo: b.correo, password: '', activo: b.activo })}>
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>{' '}
                      <button className="btn-icon delete" onClick={() => borrar(b.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title={modal.id ? 'Editar Barista' : 'Agregar Barista'} onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input type="text" value={modal.nombre} onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Correo</label>
            <input type="email" value={modal.correo} onChange={(e) => setModal((m) => ({ ...m, correo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>{modal.id ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
            <input type="password" value={modal.password} placeholder="Mín. 8: mayúscula, minúscula, número y símbolo" autoComplete="new-password" onChange={(e) => setModal((m) => ({ ...m, password: e.target.value }))} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={modal.activo} onChange={(e) => setModal((m) => ({ ...m, activo: e.target.checked }))} /> Usuario activo
            </label>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
