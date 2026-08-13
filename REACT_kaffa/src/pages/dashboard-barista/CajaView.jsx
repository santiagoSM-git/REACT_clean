import { useState } from 'react';
import { Auth } from '../../lib/auth';
import { Storage } from '../../lib/storage';
import { useBarista } from './BaristaContext.jsx';

export default function CajaView() {
  const { cerrarTurno } = useBarista();
  const user = Auth.getCurrentUser();
  const [efectivoReal, setEfectivoReal] = useState('');
  const [ventasSistema] = useState(0);
  const [reporteCaja, setReporteCaja] = useState(null);
  const [observacion, setObservacion] = useState('');

  const calcularCierre = () => {
    const base = 50;
    const ventas = ventasSistema || 0;
    const real = parseFloat(efectivoReal);
    if (Number.isNaN(real)) {
      alert('Ingresa monto');
      return;
    }
    const diff = real - (base + ventas);
    setReporteCaja({ diff });
  };

  return (
    <div className="content-section active" id="caja">
      <h2 className="section-title">Arqueo de Caja</h2>
      <div className="caja-container">
        <div className="form-group">
          <label>
            <i className="fa-solid fa-coins"></i> Base inicial:
          </label>
          <input type="number" value="50.00" readOnly />
        </div>
        <div className="form-group">
          <label>
            <i className="fa-solid fa-receipt"></i> Ventas Sistema:
          </label>
          <input type="number" value={ventasSistema.toFixed(2)} readOnly />
        </div>
        <div className="form-group">
          <label>
            <i className="fa-solid fa-money-bill-wave"></i> Efectivo Real:
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={efectivoReal}
            onChange={(e) => setEfectivoReal(e.target.value)}
          />
        </div>
        <button className="btn-cierre" onClick={calcularCierre}>
          Verificar Cierre
        </button>
        {reporteCaja && (
          <div
            id="reporteCaja"
            className={`reporte-box ${reporteCaja.diff === 0 ? 'success' : reporteCaja.diff < 0 ? 'error' : 'warning'}`}
          >
            Resultado:{' '}
            {reporteCaja.diff === 0 ? (
              <span>
                <i className="fa-solid fa-circle-check"></i> Perfecto
              </span>
            ) : reporteCaja.diff < 0 ? (
              <span>
                <i className="fa-solid fa-circle-xmark"></i> Faltante
              </span>
            ) : (
              <span>
                <i className="fa-solid fa-triangle-exclamation"></i> Sobrante
              </span>
            )}{' '}
            ${Math.abs(reporteCaja.diff).toFixed(2)}
          </div>
        )}
        {reporteCaja && reporteCaja.diff !== 0 && (
          <div
            id="seccionReportarAdmin"
            style={{ marginTop: '20px', borderTop: '1px dashed var(--border)', paddingTop: '15px' }}
          >
            <h4 style={{ color: 'var(--danger)', marginTop: '0' }}>Reportar Novedad</h4>
            <div className="form-group">
              <textarea
                rows="3"
                placeholder="Justificación..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              ></textarea>
            </div>
            <button
              className="btn-alert"
              onClick={() => {
                Storage.addReporte({
                  barista: user?.nombre || 'Barista',
                  mensaje: observacion || 'Novedad de caja',
                  prioridad: 'Media',
                });
                setObservacion('');
                setReporteCaja(null);
                alert('Reporte enviado ✅');
              }}
            >
              <i className="fa-solid fa-bell"></i> Enviar al Admin
            </button>
          </div>
        )}
        <button
          className="btn-cierre"
          style={{ background: 'var(--danger)', marginTop: '20px' }}
          onClick={() => {
            if (window.confirm('¿Estás seguro de cerrar el turno? El tablero quedará disponible sin turno activo.')) {
              cerrarTurno();
            }
          }}
        >
          <i className="fa-solid fa-door-closed"></i> Cerrar Turno Actual
        </button>
      </div>
    </div>
  );
}
