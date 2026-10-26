import { useCallback, useEffect, useState } from 'react';
import { usePromociones } from '../../hooks/usePromociones';
import PromoBannerCard from './PromoBannerCard';
import styles from './promociones.module.css';

const SESSION_KEY = 'kaffaPromoPopupCerrado';
const AUTOPLAY_MS = 5000;

function cerrarEnSesion() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* almacenamiento no disponible */
  }
}

function cerradoEnSesion() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export default function PromoCarouselPopup() {
  const { promociones } = usePromociones({ soloVigentes: true });
  const [cerrada, setCerrada] = useState(cerradoEnSesion);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [pausadoHover, setPausadoHover] = useState(false);

  const total = promociones.length;
  const abierta = !cerrada && total > 0;
  const indiceActual = total ? indice % total : 0;
  const promoActual = promociones[indiceActual];

  const cerrar = useCallback(() => {
    cerrarEnSesion();
    setCerrada(true);
  }, []);

  const mover = useCallback(
    (paso) => {
      setPausado(true);
      setIndice((actual) => (actual + paso + total) % total);
    },
    [total],
  );

  const irA = useCallback((destino) => {
    setPausado(true);
    setIndice(destino);
  }, []);

  useEffect(() => {
    if (!abierta || total <= 1 || pausado || pausadoHover) return undefined;

    const timer = setInterval(() => {
      setIndice((actual) => (actual + 1) % total);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [abierta, total, pausado, pausadoHover]);

  useEffect(() => {
    if (!abierta) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') cerrar();
      if (event.key === 'ArrowLeft') mover(-1);
      if (event.key === 'ArrowRight') mover(1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [abierta, cerrar, mover]);

  useEffect(() => {
    if (!abierta) return undefined;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [abierta]);

  if (!abierta) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cerrar();
      }}
    >
      <div
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-label="Promociones KAFFA"
        onMouseEnter={() => setPausadoHover(true)}
        onMouseLeave={() => setPausadoHover(false)}
      >
        <button type="button" className={styles.close} onClick={cerrar} aria-label="Cerrar promociones">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {total > 1 && (
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => mover(-1)} aria-label="Promoción anterior">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}

        <div className={styles.popupCard} key={promoActual.id}>
          <PromoBannerCard promo={promoActual} onCta={() => setCerrada(true)} />
        </div>

        {total > 1 && (
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => mover(1)} aria-label="Promoción siguiente">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}

        {total > 1 && (
          <div className={styles.dots} role="tablist" aria-label="Seleccionar promoción">
            {promociones.map((promo, i) => (
              <button
                key={promo.id}
                type="button"
                className={`${styles.dot}${i === indiceActual ? ` ${styles.active}` : ''}`}
                onClick={() => irA(i)}
                role="tab"
                aria-selected={i === indiceActual}
                aria-label={`Ir a la promoción ${i + 1} de ${total}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
