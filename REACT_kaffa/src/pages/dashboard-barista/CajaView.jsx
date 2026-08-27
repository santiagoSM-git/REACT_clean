import { useEffect, useState } from 'react';
import { Auth } from '../../lib/auth';
import { Api } from '../../lib/api';
import { fechaHora, money } from './helpers';

export default function CajaView() {
  const [caja, setCaja] = useState(null); // caja abierta (con movimientos + relaciones)
  const [cargando, setCargando] = useState(true);
  const [baseEfectivo, setBaseEfectivo] = useState('');
  const [baseDigital, setBaseDigital] = useState('');
  const [efectivoReal, setEfectivoReal] = useState('');
  const [digitalReal, setDigitalReal] = useState('');
  const [reporteCaja, setReporteCaja] = useState(null); // resumen del cierre
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/cajas', { estado: 'abierta', per_page: 100 });
      const abiertas = Api.unwrapList(resp).items;
      const yo = Auth.getCurrentUser();
      setCaja(abiertas.find((c) => c.abierta_por == yo?.id) || (yo ? abiertas[0] : null));
    } catch {
      /* sin turno u otro error → se reintenta */
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // La ruta /cajas tiene throttle 10/min en el backend → poll menos frecuente
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  const abrirCaja = async () => {
    const ef = Number(baseEfectivo);
    const dig = Number(baseDigital);
    if (Number.isNaN(ef) || Number.isNaN(dig) || ef < 0 || dig < 0) return alert('Ingresa bases válidas.');
    if (ef + dig <= 0) return alert('Ingresa la base de apertura (efectivo y/o digital).');

    setSaving(true);
    try {
      await Api.post('/cajas', {
        monto_apertura_fisico: ef + dig,
        monto_apertura_efectivo: ef,
        monto_apertura_digital: dig,
      });
      setBaseEfectivo('');
      setBaseDigital('');
      cargar();
    } catch (err) {
      alert('❌ ' + Api.turnoMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cerrarCaja = async () => {
    if (!caja) return;
    const ef = Number(efectivoReal);
    const dig = Number(digitalReal);
    if (Number.isNaN(ef) || Number.isNaN(dig) || ef < 0 || dig < 0) return alert('Ingresa los montos reales contados.');

    setSaving(true);
    try {
      await Api.put('/cajas/' + caja.id, {
        estado: 'cerrada',
        monto_cierre_fisico: ef + dig,
        monto_cierre_efectivo: ef,
        monto_cierre_digital: dig,
      });
      // El PUT no incluye relaciones → consultar el detalle completo (eager)
      const detResp = await Api.get('/cajas/' + caja.id);
      const cerrada = Api.unwrapOne(detResp);
      const sistema = Number(cerrada.monto_cierre_sistema) || 0;
      const diff = ef + dig - sistema;
      const turnoCerrada = cerrada.turno
        ? `${cerrada.turno.tipo === 'mañana' ? 'Mañana' : 'Tarde'} (${cerrada.turno.fecha})`
        : '—';
      setReporteCaja({
        cerrada,
        diff,
        sistema,
        real: ef + dig,
        aperturaEf: Number(cerrada.monto_apertura_efectivo) || 0,
        aperturaDig: Number(cerrada.monto_apertura_digital) || 0,
        cierreEf: ef,
        cierreDig: dig,
        turnoTexto: turnoCerrada,
      });
      setCaja(null);
      setEfectivoReal('');
      setDigitalReal('');
      setTimeout(cargar, 1500);
    } catch (err) {
      alert('❌ ' + Api.turnoMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (cargando) {
    return (
      <div className="content-section active" id="caja">
        <h2 className="section-title">Caja del Turno</h2>
        <p className="text-muted">Cargando…</p>
      </div>
    );
  }

  const apertura = Number(caja?.monto_apertura_fisico) || Number(caja?.monto_apertura_sistema) || 0;
  const aperturaEf = Number(caja?.monto_apertura_efectivo) || 0;
  const aperturaDig = Number(caja?.monto_apertura_digital) || 0;
  const ingresos = (caja?.movimientos || []).filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto || 0), 0);
  const egresos = (caja?.movimientos || []).filter((m) => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto || 0), 0);

  const turnoTexto = caja?.turno
    ? `${caja.turno.tipo === 'mañana' ? 'Mañana' : 'Tarde'} (${caja.turno.fecha})`
    : '—';

  return (
    <div className="content-section active" id="caja">
      <h2 className="section-title">Caja del Turno</h2>
      <div className="caja-container">
        {reporteCaja && (
          <div className={`reporte-box ${reporteCaja.diff === 0 ? 'success' : reporteCaja.diff < 0 ? 'error' : 'warning'}`} style={{ marginBottom: '16px', textAlign: 'left' }}>
            <b>Resumen de cierre — Caja #{reporteCaja.cerrada.id}</b>
            <br />
            Abrió: <b>{reporteCaja.cerrada.usuario_apertura?.nombre || '—'}</b> · Turno: <b>{reporteCaja.turnoTexto}</b> ·{' '}
            {fechaHora(reporteCaja.cerrada.fecha_apertura)}
            <br />
            Cerró: <b>{reporteCaja.cerrada.usuario_cierre?.nombre || '—'}</b> · {fechaHora(reporteCaja.cerrada.fecha_cierre)}
            <br />
            Monto inicial: Efectivo <b>{money(reporteCaja.aperturaEf)}</b> + Digital <b>{money(reporteCaja.aperturaDig)}</b>
            <br />
            Monto final: Efectivo <b>{money(reporteCaja.cierreEf)}</b> + Digital <b>{money(reporteCaja.cierreDig)}</b> = {money(reporteCaja.real)}
            <br />
            Sistema: {money(reporteCaja.sistema)} · Resultado:{' '}
            {reporteCaja.diff === 0 ? (
              <span><i className="fa-solid fa-circle-check"></i> Perfecto</span>
            ) : reporteCaja.diff < 0 ? (
              <span><i className="fa-solid fa-circle-xmark"></i> Faltante {money(Math.abs(reporteCaja.diff))}</span>
            ) : (
              <span><i className="fa-solid fa-triangle-exclamation"></i> Sobrante {money(reporteCaja.diff)}</span>
            )}
          </div>
        )}

        {!caja ? (
          <>
            <p className="text-muted">No hay caja abierta para este turno. Abre una para registrar movimientos.</p>
            <div className="form-group">
              <label><i className="fa-solid fa-money-bill-wave"></i> Base en Efectivo:</label>
              <input type="number" min="0" step="0.01" placeholder="Ej. 50000" value={baseEfectivo} onChange={(e) => setBaseEfectivo(e.target.value)} />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-mobile-screen"></i> Base Digital (Nequi/Daviplata/transferencias):</label>
              <input type="number" min="0" step="0.01" placeholder="Ej. 0" value={baseDigital} onChange={(e) => setBaseDigital(e.target.value)} />
            </div>
            <button className="btn-cierre" onClick={abrirCaja} disabled={saving}>
              <i className="fa-solid fa-door-open"></i> Abrir Caja
            </button>
          </>
        ) : (
          <>
            <p className="text-muted">
              Caja #{caja.id} abierta por <b>{caja.usuario_apertura?.nombre || '—'}</b> · Turno <b>{turnoTexto}</b> ·{' '}
              {fechaHora(caja.fecha_apertura)}
            </p>
            <div className="form-group">
              <label><i className="fa-solid fa-money-bill-wave"></i> Base Efectivo (apertura):</label>
              <input type="number" value={aperturaEf.toFixed(2)} readOnly />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-mobile-screen"></i> Base Digital (apertura):</label>
              <input type="number" value={aperturaDig.toFixed(2)} readOnly />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-receipt"></i> Ventas Sistema (ingresos):</label>
              <input type="number" value={ingresos.toFixed(2)} readOnly />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-calculator"></i> Esperado en caja (efectivo + digital):</label>
              <input type="number" value={(apertura + ingresos - egresos).toFixed(2)} readOnly />
            </div>
            <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '12px 0' }} />
            <div className="form-group">
              <label><i className="fa-solid fa-money-bill-wave"></i> Efectivo Real contado:</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={efectivoReal} onChange={(e) => setEfectivoReal(e.target.value)} />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-mobile-screen"></i> Digital Real (Nequi/Daviplata/transferencias):</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={digitalReal} onChange={(e) => setDigitalReal(e.target.value)} />
            </div>
            <button className="btn-cierre" onClick={cerrarCaja} disabled={saving}>
              <i className="fa-solid fa-lock"></i> Cerrar Caja
            </button>
          </>
        )}
      </div>
    </div>
  );
}
