import { Link } from 'react-router-dom';
import CloudinaryImage from '../media/CloudinaryImage';
import { PromocionesStore } from '../../lib/promociones-store';

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
    <span className="promo-card-cta">{etiquetaCta}</span>
  ) : enlace.externo ? (
    <a className="promo-card-cta" href={enlace.href} target="_blank" rel="noreferrer" onClick={onCta}>
      {etiquetaCta}
    </a>
  ) : (
    <Link className="promo-card-cta" to={enlace.href} onClick={onCta}>
      {etiquetaCta}
    </Link>
  );

  return (
    <article className="promo-card" style={{ '--promo-bg': fondo }}>
      <div className="promo-card-media">
        <CloudinaryImage
          src={promo?.imagen}
          alt={promo?.nombre || promo?.mensaje || 'Promoción KAFFA'}
          w={1200}
          h={760}
          loading={preview ? 'eager' : 'lazy'}
          fallback={
            <span className="promo-card-placeholder" aria-hidden="true">
              <i className={`fa-solid ${tipo.icono}`}></i>
            </span>
          }
        />
      </div>
      <div className="promo-card-body">
        <span className="promo-card-eyebrow">
          {promo?.fecha_vencimiento ? '¡Por tiempo limitado!' : 'Promoción especial'}
        </span>
        <span className="promo-card-tag">
          <i className={`fa-solid ${tipo.icono}`}></i> {tipo.label}
        </span>
        <h3 className="promo-card-title">{mensaje}</h3>
        {cta}
      </div>
    </article>
  );
}
