/**
 * KAFFA - <img> optimizado para Cloudinary.
 *
 * Aplica transformaciones de entrega (`f_auto,q_auto` + ancho/alto objetivo) y
 * carga diferida. Para URLs externas (no Cloudinary) se comporta como un <img>
 * normal, por lo que es seguro reemplazar cualquier imagen del proyecto.
 */
import { useEffect, useState } from 'react';
import { cloudinaryUrl } from '../../lib/cloudinary';

export default function CloudinaryImage({
  src,
  alt = '',
  w,
  h,
  crop = 'fill',
  gravity,
  className,
  style,
  loading = 'lazy',
  fallback = null,
  ...rest
}) {
  const [fallo, setFallo] = useState(false);

  // Reinicia el estado de error cuando cambia la fuente.
  useEffect(() => {
    setFallo(false);
  }, [src]);

  if (!src || fallo) return fallback;

  return (
    <img
      {...rest}
      className={className}
      style={style}
      src={cloudinaryUrl(src, { w, h, crop, gravity })}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFallo(true)}
    />
  );
}
