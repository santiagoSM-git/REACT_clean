import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, fechaStr, money } from './helpers';

function turnoTexto(caja) {
  if (!caja?.turno) return '—';
  return `${caja.turno.tipo === 'mañana' ? 'Mañana' : 'Tarde'} (${caja.turno.fecha})`;
}

export default function CajasView() {
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(null); // caja a cerrar
  const [baseEfectivo, setBaseEfectivo] = useState('');
  const [baseDigital, setBaseDigital] = useState('');
  const [efectivoReal, setEfectivoReal] = useState('');
  const [digitalReal, setDigitalReal] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/cajas', { per_page: 100 });
      setCajas(Api.unwrapList(resp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirCaja = async () => {
    const ef = Number(baseEfectivo);
    const dig = Number(baseDigital);
    if (Number.isNaN(ef) || Number.isNaN(dig) || ef < 0 || dig < 0) return alert('Ingresa bases válidas.');
    if (ef + dig <= 0) return alert('Ingresa la base de apertura.');

    setSaving(true);
    try {
      await Api.post('/cajas', {
        monto_apertura_fisico: ef + dig,
        monto_apertura_efectivo: ef,
        monto_apertura_digital: dig,
      });
      setModalAbrir(false);
      setBaseEfectivo('');
      setBaseDigital('');
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const cerrarCaja = async () => {
    if (!modalCerrar) return;
    const ef = Number(efectivoReal);
    const dig = Number(digitalReal);
    if (Number.isNaN(ef) || Number.isNaN(dig) || ef < 0 || dig < 0) return alert('Ingresa los montos reales contados.');

    setSaving(true);
    try {
      await Api.put('/cajas/' + modalCerrar.id, {
        estado: 'cerrada',
        monto_cierre_fisico: ef + dig,
        monto_cierre_efectivo: ef,
        monto_cierre_digital: dig,
      });
      setModalCerrar(null);
      setEfectivoReal('');
      setDigitalReal('');
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-cash-register"></i> Cajas</h3>
          <button className="btn-primary" onClick={() => setModalAbrir(true)}><i className="fa-solid fa-plus"></i> Abrir Caja</button>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>Como superusuario puedes abrir y cerrar cajas (sin turno) y ver el detalle completo.</p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>ID</th><th>Estado</th><th>Abrió</th><th>Turno</th><th>Apertura</th><th>Cerró</th><th>Cierre Sistema</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={8} text="Cargando…" />
              ) : cajas.length === 0 ? (
                <EmptyRow cols={8} text="Sin cajas" />
              ) : (
                cajas.map((c) => {
                  const abierta = c.estado === 'abierta';
                  const sistema =
                    c.monto_cierre_sistema ??
                    (Number(c.monto_apertura_sistema) + (c.movimientos || []).reduce((s, m) => s + (m.tipo === 'ingreso' ? 1 : -1) * Number(m.monto || 0), 0));
                  return (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>{abierta ? <span className="badge badge-success">Abierta</span> : <span className="badge badge-danger">Cerrada</span>}</td>
                      <td>{c.usuario_apertura?.nombre || '—'}</td>
                      <td>{turnoTexto(c)}</td>
                      <td>{fechaStr(c.fecha_apertura)}</td>
                      <td>{c.usuario_cierre?.nombre || '—'}</td>
                      <td>{money(sistema)}</td>
                      <td>
                        <button className="btn-icon view" onClick={() => setDetalle(c)} title="Ver detalle"><i className="fa-solid fa-eye"></i></button>{' '}
                        {abierta && (
                          <button className="btn-icon edit" onClick={() => { setModalCerrar(c); setEfectivoReal(''); setDigitalReal(''); }} title="Cerrar caja">
                            <i className="fa-solid fa-lock"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbrir && (
        <CrudModal title="Abrir Caja" onClose={() => setModalAbrir(false)} onSave={abrirCaja} saving={saving} saveLabel="Abrir Caja">
          <div className="form-group">
            <label>Base en Efectivo</label>
            <input type="number" min="0" step="0.01" value={baseEfectivo} onChange={(e) => setBaseEfectivo(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Base Digital (Nequi/Daviplata/transferencias)</label>
            <input type="number" min="0" step="0.01" value={baseDigital} onChange={(e) => setBaseDigital(e.target.value)} />
            <small className="text-muted">Como administrador la caja queda sin turno asignado.</small>
          </div>
        </CrudModal>
      )}

      {modalCerrar && (
        <CrudModal title={`Cerrar Caja #${modalCerrar.id}`} onClose={() => setModalCerrar(null)} onSave={cerrarCaja} saving={saving} saveLabel="Cerrar Caja">
          <p className="text-muted">
            Abierta por <b>{modalCerrar.usuario_apertura?.nombre || '—'}</b> · Turno <b>{turnoTexto(modalCerrar)}</b> · {fechaStr(modalCerrar.fecha_apertura)}
          </p>
          <div className="form-group">
            <label>Efectivo Real contado</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={efectivoReal} onChange={(e) => setEfectivoReal(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Digital Real (Nequi/Daviplata/transferencias)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={digitalReal} onChange={(e) => setDigitalReal(e.target.value)} />
          </div>
        </CrudModal>
      )}

      {detalle && (
        <CrudModal title={`Detalle Caja #${detalle.id}`} onClose={() => setDetalle(null)} saveLabel="Cerrar" onSave={() => setDetalle(null)} width={640}>
          <p>
            <b>Estado:</b> {detalle.estado === 'abierta' ? <span className="badge badge-success">Abierta</span> : <span className="badge badge-danger">Cerrada</span>}
          </p>
          <p><b>Abierta por:</b> {detalle.usuario_apertura?.nombre || '—'} · <b>Fecha:</b> {fechaStr(detalle.fecha_apertura)}</p>
          <p><b>Turno:</b> {turnoTexto(detalle)}</p>
          <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '8px', margin: '10px 0' }}>
            <b>Monto inicial</b>
            <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>Efectivo: {money(detalle.monto_apertura_efectivo)}</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>Digital: {money(detalle.monto_apertura_digital)}</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>Total: {money(detalle.monto_apertura_fisico)}</p>
          </div>
          {detalle.fecha_cierre ? (
            <>
              <p><b>Cerrada por:</b> {detalle.usuario_cierre?.nombre || '—'} · <b>Fecha:</b> {fechaStr(detalle.fecha_cierre)}</p>
              <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '8px', margin: '10px 0' }}>
                <b>Monto final del turno</b>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>Efectivo: {money(detalle.monto_cierre_efectivo)}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>Digital: {money(detalle.monto_cierre_digital)}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>Total real: {money(detalle.monto_cierre_fisico)} · Sistema: {money(detalle.monto_cierre_sistema)}</p>
              </div>
            </>
          ) : (
            <p className="text-muted">Caja aún abierta.</p>
          )}
          <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
            <b>Movimientos ({(detalle.movimientos || []).length})</b>
            {(detalle.movimientos || []).map((m, i) => (
              <p key={i} style={{ fontSize: '0.85rem', padding: '2px 0' }}>
                <i className={`fa-solid ${m.tipo === 'ingreso' ? 'fa-arrow-down text-success' : 'fa-arrow-up text-danger'}`}></i>{' '}
                {m.tipo}: {money(m.monto)} — {m.descripcion || ''} ({fechaStr(m.created_at)})
              </p>
            ))}
            {(detalle.movimientos || []).length === 0 && <p className="text-muted">Sin movimientos</p>}
          </div>
        </CrudModal>
      )}
    </div>
  );
}
