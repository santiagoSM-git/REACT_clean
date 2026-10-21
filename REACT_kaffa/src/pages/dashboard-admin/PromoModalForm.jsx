import { useRef, useState } from 'react';
import CloudinaryImage from '../../components/media/CloudinaryImage';
import PromoBannerCard from '../../components/promociones/PromoBannerCard';
import { uploadImage } from '../../lib/cloudinary';
import { PALETA_PROMOCIONES, TIPOS_PROMOCION } from '../../lib/promociones-store';

function valorInicial(promo) {
  return {
    nombre: promo?.nombre || '',
    mensaje: promo?.mensaje || '',
    tipo: promo?.tipo || 'descuento',
    color: promo?.color || PALETA_PROMOCIONES[0].valor,
    fecha_vencimiento: promo?.fecha_vencimiento ? String(promo.fecha_vencimiento).slice(0, 16) : '',
    enlace: promo?.enlace || '/menu',
    imagen: promo?.imagen || '',
    activa: promo?.activa !== false,
  };
}

export default function PromoModalForm({ promo, onClose, onSave, saving = false }) {
  const [form, setForm] = useState(() => valorInicial(promo));
  const [error, setError] = useState('');
  const [dragActivo, setDragActivo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const inputRef = useRef(null);

  const esEdicion = !!promo?.id;

  const setCampo = (campo, valor) => {
    setError('');
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const subirArchivo = async (archivo) => {
    if (!archivo || subiendo) return;
    setError('');
    setSubiendo(true);
    setProgreso(0);

    try {
      const resultado = await uploadImage(archivo, { onProgress: setProgreso });
      setCampo('imagen', resultado.url);
    } catch (err) {
      setError(err?.message || 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActivo(false);
    subirArchivo(event.dataTransfer.files?.[0]);
  };

  const guardar = () => {
    if (!form.nombre.trim()) {
      setError('El nombre de la promoción es obligatorio.');
      return;
    }
    if (!form.mensaje.trim()) {
      setError('El mensaje de la promoción es obligatorio.');
      return;
    }

    onSave({
      ...form,
      nombre: form.nombre.trim(),
      mensaje: form.mensaje.trim(),
      enlace: form.enlace.trim() || '/menu',
      fecha_vencimiento: form.fecha_vencimiento || null,
    });
  };

  return (
    <div
      className="modal-overlay open"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="modal-content promo-modal">
        <button type="button" className="modal-close" onClick={onClose} disabled={saving} aria-label="Cerrar">
          &times;
        </button>

        <div className="promo-modal-head">
          <span className="promo-modal-kicker">Marketing</span>
          <h2>
            <i className="fa-solid fa-bullhorn"></i>{' '}
            {esEdicion ? 'Editar Promoción' : 'Nueva Promoción'}
          </h2>
          <p>Configura el banner que verán los clientes al entrar al sitio.</p>
        </div>

        <div className="promo-form-grid">
          <div className="promo-form-col">
            <div className="form-group">
              <label htmlFor="promo-nombre">Nombre de la promoción</label>
              <input
                id="promo-nombre"
                type="text"
                maxLength={90}
                value={form.nombre}
                onChange={(event) => setCampo('nombre', event.target.value)}
                placeholder="Ej. Semana del café"
              />
            </div>

            <div className="form-group">
              <label htmlFor="promo-mensaje">Mensaje a mostrar</label>
              <textarea
                id="promo-mensaje"
                rows={2}
                maxLength={140}
                value={form.mensaje}
                onChange={(event) => setCampo('mensaje', event.target.value)}
                placeholder="Ej. 20% DCTO en bebidas"
              />
            </div>

            <div className="form-group">
              <label>Tipo de promoción</label>
              <div className="promo-type-pills" role="group" aria-label="Tipo de promoción">
                {TIPOS_PROMOCION.map((tipo) => (
                  <button
                    key={tipo.valor}
                    type="button"
                    className={form.tipo === tipo.valor ? 'active' : ''}
                    onClick={() => setCampo('tipo', tipo.valor)}
                  >
                    <i className={`fa-solid ${tipo.icono}`}></i> {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Color de fondo</label>
              <div className="promo-color-swatches">
                {PALETA_PROMOCIONES.map((color) => (
                  <button
                    key={color.valor}
                    type="button"
                    className={form.color === color.valor ? 'active' : ''}
                    style={{ background: color.valor }}
                    onClick={() => setCampo('color', color.valor)}
                    title={color.nombre}
                    aria-label={color.nombre}
                    aria-pressed={form.color === color.valor}
                  >
                    <i className="fa-solid fa-check"></i>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="promo-vencimiento">Fecha y hora de vencimiento</label>
              <div className="promo-date-row">
                <input
                  id="promo-vencimiento"
                  type="datetime-local"
                  value={form.fecha_vencimiento}
                  onChange={(event) => setCampo('fecha_vencimiento', event.target.value)}
                />
                {form.fecha_vencimiento && (
                  <button
                    type="button"
                    className="promo-link-btn"
                    onClick={() => setCampo('fecha_vencimiento', '')}
                  >
                    Quitar
                  </button>
                )}
              </div>
              <small className="promo-help">
                Si no eliges fecha, la promoción queda activa hasta que la desactives manualmente.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="promo-enlace">Enlace de la promoción</label>
              <input
                id="promo-enlace"
                type="text"
                value={form.enlace}
                onChange={(event) => setCampo('enlace', event.target.value)}
                placeholder="/menu o https://..."
              />
              <small className="promo-help">Ruta interna o URL completa a donde llevará el botón.</small>
            </div>

            <label className="promo-switch">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(event) => setCampo('activa', event.target.checked)}
              />
              <span className="promo-switch-track" aria-hidden="true">
                <span></span>
              </span>
              <span className="promo-switch-text">
                <strong>Promoción activa</strong>
                <small>Desactívala para ocultarla sin eliminarla.</small>
              </span>
            </label>

            {error && (
              <p className="promo-form-error" role="alert">
                <i className="fa-solid fa-circle-exclamation"></i> {error}
              </p>
            )}
          </div>

          <aside className="promo-preview-pane">
            <div className="promo-preview-head">
              <span>Previsualización en vivo</span>
              <small>Así lo verá el cliente</small>
            </div>

            <div className="promo-image-field">
              <label
                htmlFor="promo-imagen"
                className={`promo-dropzone${dragActivo ? ' drag-active' : ''}${form.imagen ? ' has-image' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActivo(true);
                }}
                onDragLeave={() => setDragActivo(false)}
                onDrop={onDrop}
              >
                <input
                  id="promo-imagen"
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={subiendo}
                  onChange={(event) => {
                    subirArchivo(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />

                {form.imagen ? (
                  <CloudinaryImage src={form.imagen} alt="Imagen de la promoción" w={900} h={520} loading="eager" />
                ) : (
                  <span className="promo-dropzone-content">
                    <i className={`fa-solid ${subiendo ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                    <strong>{subiendo ? `Subiendo… ${progreso}%` : 'Elegir imagen'}</strong>
                    <small>{subiendo ? 'Espera un momento' : 'o arrastra y suelta aquí'}</small>
                  </span>
                )}

                {form.imagen && !subiendo && (
                  <span className="promo-dropzone-overlay">
                    <i className="fa-solid fa-arrows-rotate"></i> Cambiar imagen
                  </span>
                )}
                {subiendo && (
                  <span className="promo-dropzone-overlay">
                    <i className="fa-solid fa-spinner fa-spin"></i> Subiendo… {progreso}%
                  </span>
                )}
              </label>

              {form.imagen && !subiendo && (
                <button
                  type="button"
                  className="promo-image-remove"
                  onClick={() => setCampo('imagen', '')}
                >
                  <i className="fa-solid fa-trash-can"></i> Quitar imagen
                </button>
              )}
            </div>

            <div className="promo-preview-stage">
              <PromoBannerCard promo={form} preview />
            </div>
          </aside>
        </div>

        <div className="form-actions promo-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={guardar} disabled={saving || subiendo}>
            <i className="fa-solid fa-floppy-disk"></i>{' '}
            {saving ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear Promoción'}
          </button>
        </div>
      </div>
    </div>
  );
}
