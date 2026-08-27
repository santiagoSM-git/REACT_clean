import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, money, soloFecha } from './helpers';

export default function ComprasView() {
  const [compras, setCompras] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [medios, setMedios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { proveedor_id, numero, fecha, total, detalles: [], pagos: [] }
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const [cResp, iResp, pResp, mResp] = await Promise.all([
        Api.get('/compras', { per_page: 100 }),
        Api.get('/insumos', { per_page: 100 }),
        Api.get('/proveedores', { per_page: 100 }),
        Api.get('/medios-pago', { per_page: 100 }),
      ]);
      setCompras(Api.unwrapList(cResp).items);
      setInsumos(Api.unwrapList(iResp).items);
      setProveedores(Api.unwrapList(pResp).items);
      setMedios(Api.unwrapList(mResp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirModal = () => {
    setModal({
      proveedor_id: '',
      numero: '',
      fecha: new Date().toISOString().slice(0, 10),
      total: '',
      detalles: [{ insumo_id: insumos[0]?.id || '', cantidad: '', precio_costo: '' }],
      pagos: [],
    });
  };

  const guardar = async () => {
    const detalles = modal.detalles
      .map((d) => ({ insumo_id: Number(d.insumo_id), cantidad: Number(d.cantidad), precio_costo: Number(d.precio_costo) || 0 }))
      .filter((d) => d.insumo_id && d.cantidad > 0);
    if (!detalles.length) return alert('Agrega al menos un detalle de compra.');
    if (!modal.numero.trim()) return alert('El número de factura del proveedor es requerido.');

    const pagos = modal.pagos
      .map((p) => {
        const pago = { medio_pago_id: Number(p.medio_pago_id), monto: Number(p.monto) };
        if (p.comprobante.trim()) pago.comprobante_url = p.comprobante.trim();
        return pago;
      })
      .filter((p) => p.medio_pago_id && p.monto > 0);

    const body = {
      proveedor_id: modal.proveedor_id ? Number(modal.proveedor_id) : null,
      numero_factura_proveedor: modal.numero.trim(),
      fecha_compra: modal.fecha || null,
      total_compra: Number(modal.total) || 0,
      detalles,
      pagos,
    };

    setSaving(true);
    try {
      await Api.post('/compras', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar esta compra? El stock de sus insumos se revierte.')) return;
    try {
      await Api.delete('/compras/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-truck-ramp-box"></i> Compras a Proveedores</h3>
          <button className="btn-primary" onClick={abrirModal}><i className="fa-solid fa-plus"></i> Nueva Compra</button>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>Cada compra suma stock de sus insumos.</p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>ID</th><th>Proveedor</th><th>Factura Prov.</th><th>Total</th><th>Detalles</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={7} text="Cargando…" />
              ) : compras.length === 0 ? (
                <EmptyRow cols={7} text="Sin compras" />
              ) : (
                compras.map((c) => {
                  const det = (c.detalles || []).map((d) => d.cantidad + ' ' + (d.insumo?.nombre || 'insumo')).join(', ');
                  return (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>{c.proveedor?.nombre || '—'}</td>
                      <td><code>{c.numero_factura_proveedor}</code></td>
                      <td>{money(c.total_compra)}</td>
                      <td style={{ maxWidth: '240px' }}>{det || '—'}</td>
                      <td>{soloFecha(c.fecha_compra)}</td>
                      <td><button className="btn-icon delete" onClick={() => borrar(c.id)}><i className="fa-solid fa-trash-can"></i></button></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title="Nueva Compra" onClose={() => setModal(null)} onSave={guardar} saving={saving} width={640}>
          <div className="form-group">
            <label>Proveedor</label>
            <select value={modal.proveedor_id} onChange={(e) => setModal((m) => ({ ...m, proveedor_id: e.target.value }))}>
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>N° Factura Proveedor</label>
              <input type="text" value={modal.numero} placeholder="Ej. FV-1024" onChange={(e) => setModal((m) => ({ ...m, numero: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Fecha Compra</label>
              <input type="date" value={modal.fecha} onChange={(e) => setModal((m) => ({ ...m, fecha: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Total Compra (opcional: se calcula con detalles/pagos)</label>
            <input type="number" min="0" step="0.01" value={modal.total} onChange={(e) => setModal((m) => ({ ...m, total: e.target.value }))} />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <h4 style={{ margin: '4px 0' }}><i className="fa-solid fa-boxes-stacked"></i> Detalles (insumos comprados)</h4>
          {modal.detalles.map((d, idx) => (
            <div className="form-row-dynamic" key={idx} style={{ marginBottom: '6px' }}>
              <select style={{ flex: 2 }} value={d.insumo_id} onChange={(e) => setModal((m) => ({ ...m, detalles: m.detalles.map((x, i) => (i === idx ? { ...x, insumo_id: e.target.value } : x)) }))}>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))}
              </select>
              <input type="number" min="0.01" step="0.01" placeholder="Cantidad" style={{ flex: 1 }} value={d.cantidad} onChange={(e) => setModal((m) => ({ ...m, detalles: m.detalles.map((x, i) => (i === idx ? { ...x, cantidad: e.target.value } : x)) }))} />
              <input type="number" min="0" step="0.01" placeholder="Costo unit." style={{ flex: 1 }} value={d.precio_costo} onChange={(e) => setModal((m) => ({ ...m, detalles: m.detalles.map((x, i) => (i === idx ? { ...x, precio_costo: e.target.value } : x)) }))} />
              <button type="button" className="btn-icon delete" onClick={() => setModal((m) => ({ ...m, detalles: m.detalles.filter((_, i) => i !== idx) }))}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary" style={{ marginTop: '8px' }} onClick={() => setModal((m) => ({ ...m, detalles: [...m.detalles, { insumo_id: insumos[0]?.id || '', cantidad: '', precio_costo: '' }] }))}>
            <i className="fa-solid fa-plus"></i> Agregar detalle
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <h4 style={{ margin: '4px 0' }}><i className="fa-solid fa-coins"></i> Pagos</h4>
          {modal.pagos.map((p, idx) => (
            <div className="form-row-dynamic" key={idx} style={{ marginBottom: '6px' }}>
              <select style={{ flex: 2 }} value={p.medio_pago_id} onChange={(e) => setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, medio_pago_id: e.target.value } : x)) }))}>
                {medios.map((mp) => (
                  <option key={mp.id} value={mp.id}>{mp.nombre}{mp.es_virtual ? ' (virtual)' : ''}</option>
                ))}
              </select>
              <input type="number" min="0.01" step="0.01" placeholder="Monto" style={{ flex: 1 }} value={p.monto} onChange={(e) => setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, monto: e.target.value } : x)) }))} />
              <input type="text" placeholder="URL comprobante (si virtual)" style={{ flex: 1 }} value={p.comprobante} onChange={(e) => setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, comprobante: e.target.value } : x)) }))} />
              <button type="button" className="btn-icon delete" onClick={() => setModal((m) => ({ ...m, pagos: m.pagos.filter((_, i) => i !== idx) }))}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary" style={{ marginTop: '8px' }} onClick={() => setModal((m) => ({ ...m, pagos: [...m.pagos, { medio_pago_id: medios[0]?.id || '', monto: '', comprobante: '' }] }))}>
            <i className="fa-solid fa-plus"></i> Agregar pago
          </button>
        </CrudModal>
      )}
    </div>
  );
}
