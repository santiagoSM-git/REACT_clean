import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import CrudModal from './CrudModal';
import { EmptyRow, soloFecha, subirImagenEvento } from './helpers';

const MAX_IMAGENES = 5;

/**
 * Gestión de eventos de la administradora. Los eventos publicados se
 * muestran como cards en la sección pública "Eventos" (/eventos).
 * Cada evento admite hasta 5 imágenes (galería tipo publicación).
 */
export default function EventosView() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { id?, titulo, lugar, fecha, hora, descripcion, imagenes: [], publicado }
  const [saving, setSaving] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/eventos/admin', { per_page: 100 });
      setEventos(Api.unwrapList(resp).items);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const hoy = () => new Date().toLocaleDateString('en-CA');

  const abrirModal = (e = null) => {
    setModal(
      e
        ? {
            id: e.id,
            titulo: e.titulo || '',
            lugar: e.lugar || '',
            fecha: String(e.fecha || '').slice(0, 10) || hoy(),
            hora: e.hora ? String(e.hora).slice(0, 5) : '',
            descripcion: e.descripcion || '',
            imagenes: (e.imagenes || []).map((im) => im.url),
            publicado: !!e.publicado,
          }
        : { id: null, titulo: '', lugar: '', fecha: hoy(), hora: '', descripcion: '', imagenes: [], publicado: true },
    );
  };

  const guardar = async () => {
    if (!modal.titulo.trim()) return alert('Título requerido');
    if (!modal.fecha) return alert('Fecha requerida');
    if (!modal.descripcion.trim()) return alert('Descripción requerida');

    const body = {
      titulo: modal.titulo.trim(),
      descripcion: modal.descripcion.trim(),
      lugar: modal.lugar.trim() || null,
      fecha: modal.fecha,
      hora: modal.hora || null,
      imagenes: modal.imagenes,
      publicado: !!modal.publicado,
    };

    setSaving(true);
    try {
      if (modal.id) await Api.put('/eventos/' + modal.id, body);
      else await Api.post('/eventos', body);
      setModal(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este evento?')) return;
    try {
      await Api.delete('/eventos/' + id);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  const onImagenes = async (files) => {
    const libres = MAX_IMAGENES - modal.imagenes.length;
    const lista = Array.from(files).slice(0, Math.max(0, libres));
    if (!lista.length) return;

    setSubiendo(true);
    try {
      const urls = [];
      for (const file of lista) {
        // Subida secuencial para no saturar el backend.
        urls.push(await subirImagenEvento(file));
      }
      setModal((m) => ({ ...m, imagenes: [...m.imagenes, ...urls].slice(0, MAX_IMAGENES) }));
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setSubiendo(false);
    }
  };

  const quitarImagen = (i) => {
    setModal((m) => ({ ...m, imagenes: m.imagenes.filter((_, k) => k !== i) }));
  };

  const moverImagen = (i, dir) => {
    setModal((m) => {
      const j = i + dir;
      if (j < 0 || j >= m.imagenes.length) return m;
      const arr = [...m.imagenes];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...m, imagenes: arr };
    });
  };

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-calendar-days"></i> Eventos</h3>
          <button className="btn-primary" onClick={() => abrirModal(null)}><i className="fa-solid fa-plus"></i> Nuevo Evento</button>
        </div>
        <p className="text-muted" style={{ marginTop: '6px' }}>
          Los eventos marcados como publicados aparecen en la sección pública «Eventos».
        </p>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>Imagen</th><th>Título</th><th>Lugar</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={6} text="Cargando…" />
              ) : eventos.length === 0 ? (
                <EmptyRow cols={6} text="Sin eventos" />
              ) : (
                eventos.map((e) => {
                  const portada = e.imagenes?.[0]?.url;
                  return (
                    <tr key={e.id}>
                      <td>
                        {portada ? (
                          <img src={portada} alt={e.titulo} style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>{e.titulo}</td>
                      <td>{e.lugar || <span className="text-muted">—</span>}</td>
                      <td>{soloFecha(e.fecha)}{e.hora ? ' · ' + String(e.hora).slice(0, 5) : ''}</td>
                      <td>
                        {e.publicado
                          ? <span className="badge badge-success">Publicado</span>
                          : <span className="badge badge-warning">Borrador</span>}
                      </td>
                      <td>
                        <button className="btn-icon edit" onClick={() => abrirModal(e)} title="Editar"><i className="fa-solid fa-pen-to-square"></i></button>{' '}
                        <button className="btn-icon delete" onClick={() => borrar(e.id)} title="Eliminar"><i className="fa-solid fa-trash-can"></i></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CrudModal
          title={modal.id ? 'Editar Evento' : 'Nuevo Evento'}
          onClose={() => setModal(null)}
          onSave={guardar}
          saving={saving}
          width={620}
        >
          <div className="form-group">
            <label>Título</label>
            <input type="text" value={modal.titulo} onChange={(e) => setModal((m) => ({ ...m, titulo: e.target.value }))} placeholder="Nombre del evento" />
          </div>
          <div className="form-group">
            <label>Lugar / Procedencia</label>
            <input type="text" value={modal.lugar} onChange={(e) => setModal((m) => ({ ...m, lugar: e.target.value }))} placeholder="Ej. Popayán, Cauca" />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha</label>
              <input type="date" value={modal.fecha} onChange={(e) => setModal((m) => ({ ...m, fecha: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Hora (opcional)</label>
              <input type="time" value={modal.hora} onChange={(e) => setModal((m) => ({ ...m, hora: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={4} value={modal.descripcion} onChange={(e) => setModal((m) => ({ ...m, descripcion: e.target.value }))} placeholder="¿De qué trata el evento?" />
          </div>

          <div className="form-group">
            <label>Imágenes ({modal.imagenes.length}/{MAX_IMAGENES}) · la primera es la portada</label>
            <div className="evento-imagenes-grid">
              {modal.imagenes.map((url, i) => (
                <div className="evento-imagen-item" key={`${url}-${i}`}>
                  <img src={url} alt={`Imagen ${i + 1}`} />
                  {i === 0 && <span className="evento-imagen-cover">Portada</span>}
                  <div className="evento-imagen-acciones">
                    <button type="button" className="btn-icon" onClick={() => moverImagen(i, -1)} disabled={i === 0} title="Mover a la izquierda">
                      <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <button type="button" className="btn-icon" onClick={() => moverImagen(i, 1)} disabled={i === modal.imagenes.length - 1} title="Mover a la derecha">
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                    <button type="button" className="btn-icon delete" onClick={() => quitarImagen(i)} title="Quitar">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
              ))}

              {modal.imagenes.length < MAX_IMAGENES && (
                <label className="evento-imagen-add" title="Agregar imágenes">
                  <i className={`fa-solid ${subiendo ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
                  <span>{subiendo ? 'Subiendo…' : 'Agregar'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={subiendo}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length) onImagenes(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="evento-publicado"
              checked={modal.publicado}
              onChange={(e) => setModal((m) => ({ ...m, publicado: e.target.checked }))}
            />
            <label htmlFor="evento-publicado" style={{ margin: 0 }}>Publicar en la sección de eventos</label>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
