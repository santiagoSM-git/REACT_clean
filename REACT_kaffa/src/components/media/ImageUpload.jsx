/**
 * KAFFA - Control reutilizable de subida de imagen a Cloudinary.
 *
 * Sube la imagen directo a Cloudinary (unsigned) y notifica la `secure_url`
 * a través de `onChange`. Incluye vista previa, progreso y botón de quitar.
 *
 * Props:
 *  - value: URL actual (secure_url) o ''
 *  - onChange(url|null): recibe la URL subida o null al quitarla
 *  - label: texto del botón
 *  - disabled: deshabilita la interacción
 *  - previewSize / rounded: presentación de la vista previa
 *  - showPreview: oculta la vista previa interna (útil si el padre ya la muestra)
 *  - className: clases extra del contenedor
 */
import { useRef, useState } from 'react';
import { cloudinaryUrl, uploadImage } from '../../lib/cloudinary';

export default function ImageUpload({
  value = '',
  onChange,
  label = 'Seleccionar imagen…',
  disabled = false,
  previewSize = 64,
  rounded = false,
  showPreview = true,
  className = '',
}) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState('');

  const elegir = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setSubiendo(true);
    setProgreso(0);
    try {
      const res = await uploadImage(file, { onProgress: setProgreso });
      onChange?.(res.url);
    } catch (err) {
      const msg = err?.message || 'No se pudo subir la imagen.';
      setError(msg);
      alert('❌ ' + msg);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className={`image-upload ${className}`.trim()} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <button type="button" className="btn-secondary" onClick={elegir} disabled={disabled || subiendo}>
        <i className="fa-solid fa-cloud-arrow-up"></i> {subiendo ? `Subiendo… ${progreso}%` : label}
      </button>

      {showPreview && value && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <img
            src={cloudinaryUrl(value, { w: previewSize * 2, h: previewSize * 2, crop: rounded ? 'fill' : 'limit' })}
            alt="Vista previa"
            style={{
              width: previewSize,
              height: previewSize,
              objectFit: 'cover',
              borderRadius: rounded ? '50%' : '8px',
            }}
          />
          <button
            type="button"
            className="btn-icon delete"
            title="Quitar imagen"
            disabled={disabled || subiendo}
            onClick={() => onChange?.(null)}
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </span>
      )}

      {error && <small className="text-muted">{error}</small>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        disabled={disabled || subiendo}
        onChange={onFile}
      />
    </div>
  );
}
