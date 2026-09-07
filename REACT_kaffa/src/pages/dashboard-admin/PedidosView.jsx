import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, ESTADOS, badgeEstadoPedido, fechaStr, money } from './helpers';

export default function PedidosView() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null);

  const cargar = async () => {
    try {
      const resp = await Api.get('/pedidos', { per_page: 100 });
      setPedidos(Api.unwrapList(resp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await Api.put('/pedidos/' + id, { estado });
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  const borrar = async (id) => {
    if (!window.confirm(`¿Eliminar el pedido #${id}? (se eliminan detalles, pagos y factura)`)) return;
    try {
      await Api.delete('/pedidos/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  const exportarCSV = () => {
    if (!pedidos.length) return alert('Sin pedidos para exportar.');
    const cab = ['ID', 'Cliente', 'Barista', 'Total', 'Estado', 'Fecha'];
    const filas = pedidos.map((p) => [p.id, p.cliente?.nombre || '', p.barista?.nombre || '', p.total, p.estado, fechaStr(p.created_at)]);
    const csv = [cab, ...filas]
      .map((f) => f.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'pedidos_kaffa.csv';
    a.click();
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-clipboard-list"></i> Pedidos</h3>
          <button className="btn-primary" onClick={exportarCSV}><i className="fa-solid fa-download"></i> Exportar CSV</button>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr><th>ID</th><th>Cliente</th><th>Barista</th><th>Productos</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={7} text="Cargando…" />
              ) : pedidos.length === 0 ? (
                <EmptyRow cols={7} text="Sin pedidos" />
              ) : (
                pedidos.map((p) => {
                  const items = (p.detalles || []).map((d) => (Number(d.cantidad) || 1) + 'x ' + (d.producto?.nombre || '—') + (d.nota ? ` (${d.nota})` : '')).join(', ');
                  return (
                    <tr key={p.id}>
                      <td><b>#{p.id}</b></td>
                      <td>{p.cliente?.nombre || '—'}</td>
                      <td>{p.barista?.nombre || '—'}</td>
                      <td style={{ maxWidth: '280px' }}>{items || '—'}</td>
                      <td>{money(p.total)}</td>
                      <td>{badgeEstadoPedido(p.estado)}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn-icon view" onClick={() => setDetalle(p)} title="Ver detalle"><i className="fa-solid fa-eye"></i></button>
                          <select className="estado-select-compact" value={p.estado} onChange={(e) => cambiarEstado(p.id, e.target.value)}>
                            {Object.keys(ESTADOS).map((k) => (
                              <option key={k} value={k}>{ESTADOS[k].label}</option>
                            ))}
                          </select>
                          <button className="btn-icon delete" onClick={() => borrar(p.id)} title="Eliminar"><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detalle && (
        <CrudModal title="Detalle del Pedido" onClose={() => setDetalle(null)} saveLabel="Cerrar" onSave={() => setDetalle(null)} width={620}>
          <p><b>ID:</b> #{detalle.id}</p>
          <p><b>Cliente:</b> {detalle.cliente?.nombre || '—'} · <b>Barista:</b> {detalle.barista?.nombre || '—'}</p>
          <p><b>Estado:</b> {badgeEstadoPedido(detalle.estado)}</p>
          <p><b>Fecha:</b> {fechaStr(detalle.created_at)}</p>
          <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '8px', margin: '10px 0' }}>
            <b>Productos</b>
            {(detalle.detalles || []).map((d, i) => (
              <p key={i} style={{ fontSize: '0.85rem', padding: '2px 0' }}>
                • {(Number(d.cantidad) || 1) + 'x ' + (d.producto?.nombre || '—') + (d.nota ? ` (${d.nota})` : '')} — {money(d.subtotal ?? d.precio_unitario)}
              </p>
            ))}
            <p style={{ fontWeight: '700', marginTop: '8px' }}>Total: {money(detalle.total)}{Number(detalle.propina) ? ' (propina ' + money(detalle.propina) + ')' : ''}</p>
          </div>
          <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '8px', margin: '10px 0' }}>
            <b>Pagos</b>
            {(detalle.pagos || []).map((pg, i) => (
              <p key={i} style={{ fontSize: '0.85rem', padding: '2px 0' }}>
                <i className="fa-solid fa-coins"></i> {pg.medio_pago?.nombre || 'Pago'}: {money(pg.monto)}{' '}
                {pg.comprobante_url && <a href={pg.comprobante_url} target="_blank" rel="noreferrer">ver comprobante</a>}
              </p>
            ))}
            {(detalle.pagos || []).length === 0 && <p className="text-muted">Sin pagos registrados</p>}
          </div>
          {detalle.factura_venta ? (
            <p><b>Factura:</b> {detalle.factura_venta.numero_factura} — {money(detalle.factura_venta.total)}</p>
          ) : (
            <p className="text-muted">Sin factura</p>
          )}
        </CrudModal>
      )}
    </div>
  );
}
