import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, badgeActivo, badgeEstadoPedido, fechaStr, money } from './helpers';

export default function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null); // { usuario, pedidos }
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/usuarios', { rol: 'cliente', per_page: 100 });
      setClientes(Api.unwrapList(resp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const verCliente = async (u) => {
    setDetalle({ usuario: u, pedidos: [], cargando: true });
    try {
      const resp = await Api.get('/pedidos', { cliente_id: u.id, per_page: 50 });
      setDetalle({ usuario: u, pedidos: Api.unwrapList(resp).items, cargando: false });
    } catch (err) {
      setDetalle({ usuario: u, pedidos: [], cargando: false, error: Api.firstError(err) });
    }
  };

  const guardar = async () => {
    const body = {
      nombre: modal.nombre.trim(),
      correo: modal.correo.trim(),
      activo: modal.activo,
    };
    if (!body.nombre || !body.correo) return alert('Nombre y correo requeridos');
    setSaving(true);
    try {
      await Api.put('/usuarios/' + modal.id, body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
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
          <h3><i className="fa-solid fa-user"></i> Clientes</h3>
          <span className="badge badge-info">{clientes.length} cliente{clientes.length === 1 ? '' : 's'}</span>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>Usuarios con rol cliente (registrados desde la web).</p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Registro</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={5} text="Cargando…" />
              ) : clientes.length === 0 ? (
                <EmptyRow cols={5} text="Sin clientes registrados" />
              ) : (
                clientes.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.nombre}</b></td>
                    <td>{u.correo}</td>
                    <td>{fechaStr(u.created_at)}</td>
                    <td>{badgeActivo(u.activo)}</td>
                    <td>
                      <button className="btn-icon view" onClick={() => verCliente(u)}><i className="fa-solid fa-eye"></i></button>{' '}
                      <button className="btn-icon edit" onClick={() => setModal({ id: u.id, nombre: u.nombre, correo: u.correo, activo: u.activo })}><i className="fa-solid fa-pen-to-square"></i></button>{' '}
                      <button className="btn-icon delete" onClick={() => borrar(u.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title="Editar Cliente" onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={modal.nombre} onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Correo</label>
            <input type="email" value={modal.correo} onChange={(e) => setModal((m) => ({ ...m, correo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={modal.activo} onChange={(e) => setModal((m) => ({ ...m, activo: e.target.checked }))} /> Usuario activo
            </label>
          </div>
        </CrudModal>
      )}

      {detalle && (
        <CrudModal title="Detalle del Cliente" onClose={() => setDetalle(null)} saveLabel="Cerrar" onSave={() => setDetalle(null)} width={600}>
          <p><b>Nombre:</b> {detalle.usuario.nombre}</p>
          <p><b>Correo:</b> {detalle.usuario.correo}</p>
          <p><b>Registro:</b> {fechaStr(detalle.usuario.created_at)}</p>
          <h4 style={{ margin: '16px 0 10px' }}>
            <i className="fa-solid fa-receipt"></i> Historial de Pedidos ({detalle.pedidos.length})
          </h4>
          {detalle.cargando ? (
            <p className="text-muted">Cargando pedidos…</p>
          ) : detalle.error ? (
            <p className="text-muted">❌ {detalle.error}</p>
          ) : detalle.pedidos.length === 0 ? (
            <p className="text-muted">Este cliente aún no tiene pedidos.</p>
          ) : (
            detalle.pedidos.map((o) => {
              const items = (o.detalles || []).map((d) => (Number(d.cantidad) || 1) + 'x ' + (d.producto?.nombre || '—')).join(', ');
              return (
                <div key={o.id} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>#{o.id}</b>
                    {badgeEstadoPedido(o.estado)}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '6px 0' }}>{items || '—'}</p>
                  <p style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">{fechaStr(o.created_at)}</span>
                    <b>{money(o.total)}</b>
                  </p>
                </div>
              );
            })
          )}
        </CrudModal>
      )}
    </div>
  );
}
