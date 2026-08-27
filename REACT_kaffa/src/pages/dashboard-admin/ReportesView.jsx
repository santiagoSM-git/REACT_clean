import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import { EmptyRow, fechaStr } from './helpers';

function badgePrioridad(prioridad) {
  const cls = prioridad === 'alta' ? 'badge-danger' : prioridad === 'media' ? 'badge-warning' : 'badge-info';
  return <span className={`badge ${cls}`}>{(prioridad || 'baja').toUpperCase()}</span>;
}

export default function ReportesView() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    try {
      const resp = await Api.get('/reportes', { per_page: 100 });
      setReportes(Api.unwrapList(resp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const marcarLeido = async (id) => {
    try {
      await Api.put('/reportes/' + id, { leido: true });
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este reporte?')) return;
    try {
      await Api.delete('/reportes/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-flag"></i> Reportes de Baristas</h3>
          <span className="badge badge-warning">{reportes.length} reporte{reportes.length === 1 ? '' : 's'}</span>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>Novedades de inventario enviadas desde el panel de barista.</p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Barista</th><th>Mensaje</th><th>Prioridad</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={6} text="Cargando…" />
              ) : reportes.length === 0 ? (
                <EmptyRow cols={6} text="Sin reportes" />
              ) : (
                reportes.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.usuario?.nombre || '—'}</b></td>
                    <td style={{ maxWidth: '300px' }}>{r.mensaje}</td>
                    <td>{badgePrioridad(r.prioridad)}</td>
                    <td>{fechaStr(r.created_at)}</td>
                    <td>{r.leido ? <span className="badge badge-success">Leído</span> : <span className="badge badge-warning">Nuevo</span>}</td>
                    <td>
                      {!r.leido && <button className="btn-icon view" onClick={() => marcarLeido(r.id)} title="Marcar leído"><i className="fa-solid fa-check"></i></button>}{' '}
                      <button className="btn-icon delete" onClick={() => borrar(r.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
