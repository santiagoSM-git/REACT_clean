import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, badgeActivo, money } from './helpers';

export default function ProductosView() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { id?, nombre, descripcion, imagen, precio_venta, categoria_id, activo }
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const [prodResp, catResp] = await Promise.all([
        Api.get('/productos', { per_page: 100 }),
        Api.get('/categorias', { per_page: 100 }),
      ]);
      setProductos(Api.unwrapList(prodResp).items);
      setCategorias(Api.unwrapList(catResp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirModal = async (p = null) => {
    if (!categorias.length) {
      try {
        const catResp = await Api.get('/categorias', { per_page: 100 });
        setCategorias(Api.unwrapList(catResp).items);
      } catch { /* noop */ }
    }
    setModal(
      p
        ? { id: p.id, nombre: p.nombre, descripcion: p.descripcion || '', imagen: p.imagen || '', precio_venta: p.precio_venta ?? '', categoria_id: p.categoria_id || '', activo: p.activo }
        : { id: null, nombre: '', descripcion: '', imagen: '', precio_venta: '', categoria_id: '', activo: true },
    );
  };

  const guardar = async () => {
    const body = {
      nombre: modal.nombre.trim(),
      descripcion: modal.descripcion.trim() || null,
      imagen: modal.imagen.trim() || null,
      precio_venta: Number(modal.precio_venta),
      categoria_id: modal.categoria_id ? Number(modal.categoria_id) : null,
      activo: modal.activo,
    };
    if (!body.nombre) return alert('Nombre requerido');
    if (!(body.precio_venta >= 0)) return alert('Precio inválido');

    setSaving(true);
    try {
      if (modal.id) await Api.put('/productos/' + modal.id, body);
      else await Api.post('/productos', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este producto del menú?')) return;
    try {
      await Api.delete('/productos/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-mug-hot"></i> Productos del Menú</h3>
          <button className="btn-primary" onClick={() => abrirModal(null)}><i className="fa-solid fa-plus"></i> Nuevo Producto</button>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>Catálogo oficial (tabla productos). Lo ven clientes y baristas desde la API.</p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Activo</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={5} text="Cargando…" />
              ) : productos.length === 0 ? (
                <EmptyRow cols={5} text="Sin productos" />
              ) : (
                productos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.imagen && <img src={p.imagen} alt="" style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} />}
                        <b>{p.nombre}</b>
                      </div>
                    </td>
                    <td>{p.categoria?.nombre || '—'}</td>
                    <td>{money(p.precio_venta)}</td>
                    <td>{badgeActivo(p.activo)}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => abrirModal(p)}><i className="fa-solid fa-pen-to-square"></i></button>{' '}
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
        <CrudModal title={modal.id ? 'Editar Producto' : 'Nuevo Producto'} onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={modal.nombre} onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea rows="2" value={modal.descripcion} onChange={(e) => setModal((m) => ({ ...m, descripcion: e.target.value }))}></textarea>
          </div>
          <div className="form-group">
            <label>URL Imagen</label>
            <input type="text" value={modal.imagen} placeholder="https://..." onChange={(e) => setModal((m) => ({ ...m, imagen: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Precio Venta (COP)</label>
              <input type="number" min="0" step="0.01" value={modal.precio_venta} onChange={(e) => setModal((m) => ({ ...m, precio_venta: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={modal.categoria_id} onChange={(e) => setModal((m) => ({ ...m, categoria_id: e.target.value }))}>
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={modal.activo} onChange={(e) => setModal((m) => ({ ...m, activo: e.target.checked }))} /> Visible en el menú
            </label>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
