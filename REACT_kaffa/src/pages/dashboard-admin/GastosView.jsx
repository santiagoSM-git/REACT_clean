import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { ComprobanteUpload, EmptyRow, fechaStr, money, subirComprobante } from './helpers';

export default function GastosView() {
  const [gastos, setGastos] = useState([]);
  const [medios, setMedios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { descripcion, categoria, pagos: [] }
  const [saving, setSaving] = useState(false);

  // Primer medio no virtual: evita arrancar exigiendo comprobante.
  const medioPorDefecto = () => medios.find((m) => !m.es_virtual)?.id ?? medios[0]?.id ?? '';

  const cargar = async () => {
    try {
      const gResp = await Api.get('/gastos', { per_page: 100 });
      setGastos(Api.unwrapList(gResp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // Los medios se cargan por separado: si /gastos falla (p. ej. 429 por
    // throttle:10,1) el selector de medio de pago debe seguir con opciones.
    Api.get('/medios-pago', { per_page: 100 })
      .then((resp) => setMedios(Api.unwrapList(resp).items))
      .catch(() => {});
  }, []);

  // Si el modal ya está abierto cuando llegan los medios, completa los pagos sin medio.
  useEffect(() => {
    setModal((m) => {
      if (!m || !medios.length) return m;
      if (!m.pagos.some((p) => p.medio_pago_id === '' || p.medio_pago_id == null)) return m;
      const def = medios.find((x) => !x.es_virtual)?.id ?? medios[0].id;
      return { ...m, pagos: m.pagos.map((p) => (p.medio_pago_id === '' || p.medio_pago_id == null ? { ...p, medio_pago_id: def } : p)) };
    });
  }, [medios]);

  const abrirModal = () => {
    setModal({ descripcion: '', categoria: '', pagos: [{ medio_pago_id: medioPorDefecto(), monto: '', comprobante_url: '', subiendo: false }] });
  };

  const agregarPago = () => {
    setModal((m) => ({ ...m, pagos: [...m.pagos, { medio_pago_id: medioPorDefecto(), monto: '', comprobante_url: '', subiendo: false }] }));
  };

  const onPagoImagen = async (idx, file) => {
    if (!file) return;
    setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, subiendo: true } : x)) }));
    try {
      const url = await subirComprobante(file);
      setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, comprobante_url: url, subiendo: false } : x)) }));
    } catch (err) {
      setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, subiendo: false } : x)) }));
      alert('❌ ' + Api.firstError(err));
    }
  };

  const guardar = async () => {
    const descripcion = modal.descripcion.trim();
    if (!descripcion) return alert('Descripción requerida');

    const pagos = modal.pagos
      .map((p) => {
        const pago = { medio_pago_id: Number(p.medio_pago_id), monto: Number(p.monto) };
        if (p.comprobante_url) pago.comprobante_url = p.comprobante_url;
        return pago;
      })
      .filter((p) => p.medio_pago_id && p.monto > 0);

    if (!pagos.length) return alert('Agrega al menos un pago.');

    for (const p of pagos) {
      const medio = medios.find((m) => m.id == p.medio_pago_id);
      if (medio?.es_virtual && !p.comprobante_url) {
        return alert(`El medio "${medio.nombre}" requiere la imagen del comprobante.`);
      }
    }

    const body = {
      descripcion,
      categoria: modal.categoria.trim() || null,
      monto: pagos.reduce((s, p) => s + p.monto, 0),
      pagos,
    };

    setSaving(true);
    try {
      await Api.post('/gastos', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este gasto? Se eliminan sus pagos y movimientos de caja.')) return;
    try {
      await Api.delete('/gastos/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-money-bill-transfer"></i> Gastos</h3>
          <button className="btn-primary" onClick={abrirModal}><i className="fa-solid fa-plus"></i> Nuevo Gasto</button>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Descripción</th><th>Categoría</th><th>Total</th><th>Registrado por</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={6} text="Cargando…" />
              ) : gastos.length === 0 ? (
                <EmptyRow cols={6} text="Sin gastos" />
              ) : (
                gastos.map((g) => {
                  const total = (g.pagos || []).reduce((s, p) => s + Number(p.monto || 0), 0);
                  return (
                    <tr key={g.id}>
                      <td>{g.descripcion}</td>
                      <td>{g.categoria || '—'}</td>
                      <td>{money(total)}</td>
                      <td>{g.usuario?.nombre || '—'}</td>
                      <td>{fechaStr(g.created_at)}</td>
                      <td><button className="btn-icon delete" onClick={() => borrar(g.id)}><i className="fa-solid fa-trash-can"></i></button></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title="Nuevo Gasto" onClose={() => setModal(null)} onSave={guardar} saving={saving} width={620}>
          <div className="form-group">
            <label>Descripción</label>
            <input type="text" value={modal.descripcion} placeholder="Ej. Compra de filtros" onChange={(e) => setModal((m) => ({ ...m, descripcion: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <input type="text" value={modal.categoria} placeholder="Ej. Operativo" onChange={(e) => setModal((m) => ({ ...m, categoria: e.target.value }))} />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <h4 style={{ margin: '4px 0' }}><i className="fa-solid fa-coins"></i> Pagos</h4>
          {modal.pagos.map((p, idx) => (
            <div className="form-row-dynamic" key={idx} style={{ marginBottom: '6px' }}>
              <select style={{ flex: 2 }} value={p.medio_pago_id} onChange={(e) => setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, medio_pago_id: e.target.value } : x)) }))}>
                <option value="">Selecciona medio…</option>
                {medios.map((mp) => (
                  <option key={mp.id} value={mp.id}>{mp.nombre}{mp.es_virtual ? ' (virtual)' : ''}</option>
                ))}
              </select>
              <input type="number" min="0.01" step="0.01" placeholder="Monto" style={{ flex: 1 }} value={p.monto} onChange={(e) => setModal((m) => ({ ...m, pagos: m.pagos.map((x, i) => (i === idx ? { ...x, monto: e.target.value } : x)) }))} />
              <ComprobanteUpload url={p.comprobante_url} subiendo={p.subiendo} onFile={(f) => onPagoImagen(idx, f)} />
              <button type="button" className="btn-icon delete" onClick={() => setModal((m) => ({ ...m, pagos: m.pagos.filter((_, i) => i !== idx) }))}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary" style={{ marginTop: '8px' }} onClick={agregarPago}>
            <i className="fa-solid fa-plus"></i> Agregar pago
          </button>
        </CrudModal>
      )}
    </div>
  );
}
