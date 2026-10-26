import { Link } from 'react-router-dom';
import CloudinaryImage from '../media/CloudinaryImage';
import { PromocionesStore } from '../../lib/promociones-store';
import styles from './promociones.module.css';

function resolverEnlace(valor) {
  const enlace = String(valor || '').trim();
  if (/^https?:\/\//i.test(enlace)) return { externo: true, href: enlace };
  if (enlace.startsWith('/')) return { externo: false, href: enlace };
  if (enlace.startsWith('#')) return { externo: false, href: '/menu' };
  if (enlace) return { externo: false, href: '/' + enlace };
  return { externo: false, href: '/menu' };
}

export default function PromoBannerCard({ promo, preview = false, onCta }) {
  const tipo = PromocionesStore.obtenerTipo(promo?.tipo);
  const enlace = resolverEnlace(promo?.enlace);
  const etiquetaCta = promo?.tipo === 'descuento' ? 'VER PROMOCIÓN' : 'COMPRAR AHORA';
  const mensaje = promo?.mensaje?.trim() || 'Tu próxima promoción favorita';
  const fondo = promo?.color || '#e8f0e0';

  const cta = preview ? (
    <span className={styles.cta}>{etiquetaCta}</span>
  ) : enlace.externo ? (
    <a className={styles.cta} href={enlace.href} target="_blank" rel="noreferrer" onClick={onCta}>
      {etiquetaCta}
    </a>
  ) : (
    <Link className={styles.cta} to={enlace.href} onClick={onCta}>
      {etiquetaCta}
    </Link>
  );

  return (
    <article className={`${styles.card}${preview ? ` ${styles.preview}` : ''}`} style={{ '--promo-bg': fondo }}>
      <div className={styles.media}>
        <CloudinaryImage
          src={promo?.imagen}
          alt={promo?.nombre || promo?.mensaje || 'Promoción KAFFA'}
          w={1200}
          h={760}
          loading={preview ? 'eager' : 'lazy'}
          fallback={
            <span className={styles.placeholder} aria-hidden="true">
              <i className={`fa-solid ${tipo.icono}`}></i>
            </span>
          }
        />
      </div>
      <div className={styles.body}>
        <span className={styles.eyebrow}>
          {promo?.fecha_vencimiento ? '¡Por tiempo limitado!' : 'Promoción especial'}
        </span>
        <span className={styles.tag}>
          <i className={`fa-solid ${tipo.icono}`}></i> {tipo.label}
        </span>
        <h3 className={styles.title}>{mensaje}</h3>
        {cta}
      </div>
    </article>
  );
}
