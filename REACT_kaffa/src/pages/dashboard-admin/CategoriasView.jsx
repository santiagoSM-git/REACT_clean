import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow } from './helpers';

export default function CategoriasView() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { id?, nombre }
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/categorias', { per_page: 100 });
      setCategorias(Api.unwrapList(resp).items);
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
    const nombre = modal.nombre.trim();
    if (!nombre) return alert('Nombre requerido');
    setSaving(true);
    try {
      if (modal.id) await Api.put('/categorias/' + modal.id, { nombre });
      else await Api.post('/categorias', { nombre });
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await Api.delete('/categorias/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-tags"></i> Categorías de Productos</h3>
          <button className="btn-primary" onClick={() => setModal({ id: null, nombre: '' })}><i className="fa-solid fa-plus"></i> Nueva Categoría</button>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={3} text="Cargando…" />
              ) : categorias.length === 0 ? (
                <EmptyRow cols={3} text="Sin categorías" />
              ) : (
                categorias.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><b>{c.nombre}</b></td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setModal({ id: c.id, nombre: c.nombre })}><i className="fa-solid fa-pen-to-square"></i></button>{' '}
                      <button className="btn-icon delete" onClick={() => borrar(c.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title={modal.id ? 'Editar Categoría' : 'Nueva Categoría'} onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={modal.nombre} onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))} />
          </div>
        </CrudModal>
      )}
    </div>
  );
}
