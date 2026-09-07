/**
 * KAFFA - Widgets de compra del cliente dentro del sitio público
 * Modales trasladados 1:1 del antiguo DashboardCliente:
 * detalle de producto, carrito, pago y perfil.
 */
import { useEffect, useRef, useState } from 'react';
import { useStyles } from '../../hooks/useStyles';
import { useCarrito } from '../../context/CarritoContext';
import { Auth } from '../../lib/auth';
import { formatCurrency } from '../../lib/utils';

const IMG_DEFAULT = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';

function ProductDetailModal() {
  const { currentProduct, cerrarDetalle, addToCart } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');

  useEffect(() => {
    if (currentProduct) {
      setCantidad(1);
      setNota('');
    }
  }, [currentProduct]);

  if (!currentProduct) return null;

  const unit = Number(currentProduct.precio_venta) || 0;

  return (
    <div className="modal-overlay open" style={{ display: 'flex' }} onClick={cerrarDetalle}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={cerrarDetalle}>&times;</button>
        <img
          src={currentProduct.imagen || IMG_DEFAULT}
          style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
          alt={currentProduct.nombre}
        />
        <h2>{currentProduct.nombre}</h2>
        <p style={{ color: 'var(--primary, #39A900)', fontWeight: '700', fontSize: '1.2rem' }}>
          {formatCurrency(unit)}
        </p>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>{currentProduct.descripcion || ''}</p>

        <div className="form-group" style={{ marginTop: '14px' }}>
          <label>Cantidad</label>
          <div className="qty-stepper">
            <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Menos">−</button>
            <span>{cantidad}</span>
            <button type="button" onClick={() => setCantidad((c) => c + 1)} aria-label="Más">+</button>
            <em>{formatCurrency(unit * cantidad)}</em>
          </div>
        </div>

        <div className="form-group">
          <label>Notas para el barista (opcional)</label>
          <textarea
            rows={2}
            maxLength={500}
            placeholder="Ej: sin azúcar, poco hielo, extra de shot…"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>

        <button
          className="btn-primary"
          onClick={() => addToCart(cantidad, nota)}
          style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}
        >
          <i className="fa-solid fa-cart-plus"></i> Agregar {cantidad > 1 ? `${cantidad} ` : ''}al Carrito
        </button>
      </div>
    </div>
  );
}

function CartModal() {
  const { showCartModal, cerrarCarro, cart, remCart, updateCartQty, cartTotal, openPaymentModal } = useCarrito();
  if (!showCartModal) return null;

  return (
    <div className="modal-overlay open" style={{ display: 'flex' }} onClick={cerrarCarro}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={cerrarCarro}>&times;</button>
        <h2><i className="fa-solid fa-cart-shopping"></i> Tu Carrito</h2>
        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center' }}>Vacío</p>
          ) : (
            cart.map((i, x) => (
              <div key={x}>
                <div className="cart-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="qty-stepper qty-sm">
                      <button type="button" onClick={() => updateCartQty(x, -1)} aria-label="Menos">−</button>
                      <span>{i.qty}</span>
                      <button type="button" onClick={() => updateCartQty(x, 1)} aria-label="Más">+</button>
                    </div>
                    <b>{i.nombre}</b>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {formatCurrency((Number(i.precio_venta) || 0) * i.qty)}{' '}
                    <i className="fa-solid fa-trash" style={{ color: 'red', cursor: 'pointer' }} onClick={() => remCart(x)}></i>
                  </div>
                </div>
                {i.nota && (
                  <p className="cart-item-nota">
                    <i className="fa-solid fa-note-sticky"></i> {i.nota}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
        <h3 style={{ textAlign: 'right' }}>
          Total: <span style={{ color: 'var(--primary, #39A900)' }}>{formatCurrency(cartTotal)}</span>
        </h3>
        <button className="btn-primary" onClick={openPaymentModal} style={{ marginTop: '15px', width: '100%', justifyContent: 'center', background: 'var(--success, #27ae60)' }}>
          <i className="fa-solid fa-check"></i> Confirmar Pedido
        </button>
      </div>
    </div>
  );
}

function PaymentModal() {
  const {
    showPaymentModal, cerrarPago, medios, payOnline, paymentMedioId,
    comprobanteUrl, setPagoField, enviando, finalizeOrder,
  } = useCarrito();
  if (!showPaymentModal) return null;

  return (
    <div className="modal-overlay open" style={{ display: 'flex' }} onClick={cerrarPago}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={cerrarPago}>&times;</button>
        <h2><i className="fa-solid fa-credit-card"></i> Método de Pago</h2>

        <div className="form-group">
          <label>¿Cómo pagas?</label>
          <div className="payment-options">
            <div className={`payment-opt${!payOnline ? ' selected' : ''}`} onClick={() => setPagoField('online', false)}>
              <i className="fa-solid fa-money-bill"></i> Efectivo en mostrador
            </div>
            <div className={`payment-opt${payOnline ? ' selected' : ''}`} onClick={() => setPagoField('online', true)}>
              <i className="fa-solid fa-mobile-screen"></i> Pagar ya (transferencia)
            </div>
          </div>
        </div>

        {payOnline && (
          <>
            <div className="form-group">
              <label>Medio de Pago</label>
              <select value={paymentMedioId} onChange={(e) => setPagoField('medio', e.target.value)}>
                {medios.filter((m) => m.es_virtual).map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>URL del Comprobante (obligatorio para medios virtuales)</label>
              <input type="text" placeholder="https://... (link de la captura)" value={comprobanteUrl} onChange={(e) => setPagoField('comprobante', e.target.value)} />
              <small className="text-muted">Ej: enlace público de la captura del pago. El barista la verificará.</small>
            </div>
          </>
        )}

        <button className="btn-primary" onClick={finalizeOrder} disabled={enviando} style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
          <i className="fa-solid fa-check"></i> {enviando ? 'Enviando…' : 'Finalizar Pedido'}
        </button>
      </div>
    </div>
  );
}

function ProfileModal() {
  const { showProfileModal, cerrarPerfil, saveProfile } = useCarrito();
  const [profile, setProfile] = useState({ name: '', email: '', password: '', avatar: null });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (showProfileModal) {
      const u = Auth.getCurrentUser() || {};
      setProfile({ name: u.nombre || '', email: u.correo || '', password: '', avatar: u.avatar || null });
    }
  }, [showProfileModal]);

  if (!showProfileModal) return null;

  const user = Auth.getCurrentUser() || {};
  const avatarSrc =
    profile.avatar ||
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || 'C')}&background=293f2c&color=fff`;

  const onSave = async () => {
    setSaving(true);
    await saveProfile(profile);
    setSaving(false);
  };

  return (
    <div className="modal-overlay open" style={{ display: 'flex' }} onClick={cerrarPerfil}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={cerrarPerfil}>&times;</button>
        <h2><i className="fa-solid fa-user-gear"></i> Mi Perfil</h2>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <img src={avatarSrc} className="profile-modal-avatar" alt="Perfil" />
          <br />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '6px' }}>
            <i className="fa-solid fa-camera"></i> Cambiar Foto
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files[0]) {
                const r = new FileReader();
                r.onload = (ev) => setProfile((p) => ({ ...p, avatar: ev.target.result }));
                r.readAsDataURL(e.target.files[0]);
              }
            }}
          />
        </div>
        <div className="form-group">
          <label>Nombre Completo</label>
          <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label>Nueva Contraseña (opcional)</label>
          <input type="password" value={profile.password} placeholder="Mín. 8: mayúscula, minúscula, número y símbolo" onChange={(e) => setProfile((p) => ({ ...p, password: e.target.value }))} />
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={cerrarPerfil}>Cancelar</button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            <i className="fa-solid fa-floppy-disk"></i> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClienteWidgets() {
  useStyles(['cliente-home.css']);

  return (
    <div className="cliente-home">
      <ProductDetailModal />
      <CartModal />
      <PaymentModal />
      <ProfileModal />
    </div>
  );
}
