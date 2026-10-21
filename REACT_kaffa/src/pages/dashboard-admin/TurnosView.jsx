import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, TIPOS_TURNO, soloFecha } from './helpers';

export default function TurnosView() {
  const [turnos, setTurnos] = useState([]);
  const [baristas, setBaristas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { id?, fecha, tipo, barista_ids: [] }
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const [tResp, bResp] = await Promise.all([
        Api.get('/turnos', { per_page: 100 }),
        Api.get('/usuarios', { rol: 'barista', per_page: 100 }),
      ]);
      setTurnos(Api.unwrapList(tResp).items);
      setBaristas(Api.unwrapList(bResp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirModal = async (t = null) => {
    if (!baristas.length) {
      const bResp = await Api.get('/usuarios', { rol: 'barista', per_page: 100 });
      setBaristas(Api.unwrapList(bResp).items);
    }
    setModal(
      t
        ? {
            id: t.id,
            fecha: t.fecha ? String(t.fecha).slice(0, 10) : '',
            fecha_fin: t.fecha_fin ? String(t.fecha_fin).slice(0, 10) : '',
            tipo: t.tipo,
            barista_ids: (t.baristas || []).map((b) => b.id),
          }
        : {
            id: null,
            fecha: new Date().toISOString().slice(0, 10),
            fecha_fin: '',
            tipo: 'mañana',
            barista_ids: [],
          },
    );
  };

  const toggleBarista = (id) => {
    setModal((m) => ({
      ...m,
      barista_ids: m.barista_ids.includes(id) ? m.barista_ids.filter((x) => x !== id) : [...m.barista_ids, id],
    }));
  };

  // Muestra "inicio → fin" cuando el turno abarca varios días.
  const rangoFecha = (t) => {
    const ini = t.fecha ? String(t.fecha).slice(0, 10) : '';
    const fin = t.fecha_fin ? String(t.fecha_fin).slice(0, 10) : '';
    return fin && fin !== ini ? `${soloFecha(ini)} → ${soloFecha(fin)}` : soloFecha(t.fecha);
  };

  const guardar = async () => {
    if (!modal.fecha) return alert('Fecha requerida');
    if (!modal.barista_ids.length) return alert('Asigna al menos un barista');
    if (modal.fecha_fin && modal.fecha_fin < modal.fecha) {
      return alert('La fecha fin no puede ser anterior a la fecha de inicio');
    }
    const body = { fecha: modal.fecha, tipo: modal.tipo, barista_ids: modal.barista_ids };
    // fecha_fin es opcional: sin ella el turno dura un solo día.
    if (modal.fecha_fin) body.fecha_fin = modal.fecha_fin;

    setSaving(true);
    try {
      if (modal.id) await Api.put('/turnos/' + modal.id, body);
      else await Api.post('/turnos', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este turno?')) return;
    try {
      await Api.delete('/turnos/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-clock"></i> Turnos (mañana 07–13 / tarde 13–18 / abierto 05–22)</h3>
          <button className="btn-primary" onClick={() => abrirModal(null)}><i className="fa-solid fa-plus"></i> Nuevo Turno</button>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Baristas Asignados</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={4} text="Cargando…" />
              ) : turnos.length === 0 ? (
                <EmptyRow cols={4} text="Sin turnos" />
              ) : (
                turnos.map((t) => (
                  <tr key={t.id}>
                    <td>{rangoFecha(t)}</td>
                    <td>{TIPOS_TURNO[t.tipo] || t.tipo}</td>
                    <td>{(t.baristas || []).map((b) => b.nombre).join(', ') || <span className="text-muted">Sin baristas</span>}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => abrirModal(t)}><i className="fa-solid fa-pen-to-square"></i></button>{' '}
                      <button className="btn-icon delete" onClick={() => borrar(t.id)}><i className="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal title={modal.id ? 'Editar Turno' : 'Nuevo Turno'} onClose={() => setModal(null)} onSave={guardar} saving={saving}>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={modal.fecha} onChange={(e) => setModal((m) => ({ ...m, fecha: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Fecha fin <span className="text-muted">(opcional)</span></label>
            <input
              type="date"
              value={modal.fecha_fin}
              min={modal.fecha}
              onChange={(e) => setModal((m) => ({ ...m, fecha_fin: e.target.value }))}
            />
            <small className="text-muted">Déjala vacía para un turno de un solo día.</small>
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select value={modal.tipo} onChange={(e) => setModal((m) => ({ ...m, tipo: e.target.value }))}>
              {Object.entries(TIPOS_TURNO).map(([valor, label]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Baristas asignados</label>
            <div className="turno-barista-grid">
              {baristas.length === 0 && <p className="text-muted" style={{ gridColumn: '1 / -1' }}>No hay baristas registrados.</p>}
              {baristas.map((b) => {
                const seleccionado = modal.barista_ids.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`turno-barista-card${seleccionado ? ' selected' : ''}`}
                    onClick={() => toggleBarista(b.id)}
                  >
                    <input type="checkbox" checked={seleccionado} readOnly />
                    <span className="turno-barista-avatar">{(b.nombre || 'B').charAt(0).toUpperCase()}</span>
                    <span className="turno-barista-name">{b.nombre}</span>
                    <i className="fa-solid fa-circle-check turno-barista-check"></i>
                  </div>
                );
              })}
            </div>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
