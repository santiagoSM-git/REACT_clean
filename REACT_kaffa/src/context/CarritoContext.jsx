/* eslint-disable react-refresh/only-export-components */
/**
 * KAFFA - Carrito del cliente en el sitio público
 * Estado compartido (catálogo → carrito → pago → perfil) trasladado desde el
 * antiguo DashboardCliente: misma lógica y payloads contra la API.
 * El cliente se queda en el home; aquí solo vive el estado de compra.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from '../lib/api';
import { Auth } from '../lib/auth';
import { Storage } from '../lib/storage';

const CarritoContext = createContext(null);

export function useCarrito() {
  return useContext(CarritoContext);
}

export function CarritoProvider({ children }) {
  const navigate = useNavigate();

  // Catálogo / pago
  const [medios, setMedios] = useState([]);

  // Carrito (persistido para sobrevivir a la navegación home ↔ menú)
  const [cart, setCart] = useState(() => Storage.getCarrito());

  // Modales
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Pago
  const [paymentMedioId, setPaymentMedioId] = useState('');
  const [payOnline, setPayOnline] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Storage.setCarrito(cart);
  }, [cart]);

  // Al cerrar sesión, vaciar el carrito en memoria (auth.js ya lo limpia del storage)
  useEffect(() => {
    const onAuth = () => {
      if (!Api.getToken()) setCart([]);
    };
    window.addEventListener('kaffa-auth-change', onAuth);
    return () => window.removeEventListener('kaffa-auth-change', onAuth);
  }, []);

  useEffect(() => {
    Api.get('/medios-pago', { per_page: 100 })
      .then((mResp) => setMedios(Api.unwrapList(mResp).items))
      .catch(() => {});
  }, []);

  // ── Detalle de producto ──
  const abrirDetalle = (producto) => setCurrentProduct(producto);
  const cerrarDetalle = () => setCurrentProduct(null);

  const addToCart = (cantidad = 1, nota = '') => {
    if (!currentProduct) return;
    const qty = Math.max(1, parseInt(cantidad, 10) || 1);
    setCart((prev) => [
      ...prev,
      {
        ...currentProduct,
        qty,
        nota: (nota || '').trim() || null,
        total: (Number(currentProduct.precio_venta) || 0) * qty,
      },
    ]);
    setCurrentProduct(null);
  };

  const remCart = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const updateCartQty = (idx, delta) =>
    setCart((prev) =>
      prev.map((i, x) => {
        if (x !== idx) return i;
        const qty = Math.max(1, (Number(i.qty) || 1) + delta);
        return { ...i, qty, total: (Number(i.precio_venta) || 0) * qty };
      }),
    );

  // ── Carrito / pago ──
  const abrirCarro = () => setShowCartModal(true);
  const cerrarCarro = () => setShowCartModal(false);

  const openPaymentModal = () => {
    if (cart.length === 0) return alert('Carrito vacío');
    setShowCartModal(false);
    setPayOnline(false);
    setPaymentMedioId(medios.find((m) => !m.es_virtual)?.id || medios[0]?.id || '');
    setComprobanteUrl('');
    setShowPaymentModal(true);
  };

  const cerrarPago = () => setShowPaymentModal(false);

  const medioSeleccionado = medios.find((m) => m.id == paymentMedioId);
  const requiereComprobante = payOnline && medioSeleccionado?.es_virtual;

  const setPagoField = (key, value) => {
    if (key === 'medio') setPaymentMedioId(value);
    if (key === 'online') setPayOnline(value);
    if (key === 'comprobante') setComprobanteUrl(value);
  };

  const finalizeOrder = async () => {
    if (requiereComprobante && !comprobanteUrl.trim()) return alert('Sube el comprobante (URL) para pagos virtuales.');

    const detalles = cart.map((i) => ({
      producto_id: i.id,
      cantidad: i.qty,
      precio_unitario: Number(i.precio_venta) || 0,
      subtotal: (Number(i.precio_venta) || 0) * i.qty,
      ...(i.nota ? { nota: i.nota } : {}),
    }));
    const total = cart.reduce((s, i) => s + (Number(i.precio_venta) || 0) * i.qty, 0);

    const body = { estado: 'pendiente', total, detalles, pagos: [] };
    if (payOnline && paymentMedioId) {
      const pago = { medio_pago_id: Number(paymentMedioId), monto: total };
      if (comprobanteUrl.trim()) pago.comprobante_url = comprobanteUrl.trim();
      body.pagos = [pago];
    }

    setEnviando(true);
    try {
      await Api.post('/pedidos', body);
      setCart([]);
      setShowPaymentModal(false);
      alert('✅ Pedido enviado al barista. Pasa a pagar/recoger en mostrador. ☕');
      navigate('/pedidos');
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    } finally {
      setEnviando(false);
    }
  };

  // ── Perfil ──
  const abrirPerfil = () => setShowProfileModal(true);
  const cerrarPerfil = () => setShowProfileModal(false);

  const saveProfile = async ({ name, email, password, avatar }) => {
    const u = Auth.getCurrentUser() || {};
    const body = { nombre: (name || '').trim(), correo: (email || '').trim() };
    if (password) body.password = password;
    if (!body.nombre || !body.correo) {
      alert('Nombre y correo requeridos');
      return false;
    }

    try {
      const actualizado = await Api.put('/perfil', body);
      const next = { ...u, ...actualizado, avatar: avatar || u.avatar };
      Api.setUser(next);
      window.dispatchEvent(new Event('kaffa-auth-change'));
      setShowProfileModal(false);
      return true;
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
      return false;
    }
  };

  const cartTotal = cart.reduce((s, i) => s + (Number(i.precio_venta) || 0) * i.qty, 0);

  const value = {
    medios,
    cart,
    cartTotal,
    currentProduct,
    abrirDetalle,
    cerrarDetalle,
    addToCart,
    remCart,
    updateCartQty,
    showCartModal,
    abrirCarro,
    cerrarCarro,
    showPaymentModal,
    openPaymentModal,
    cerrarPago,
    payOnline,
    paymentMedioId,
    comprobanteUrl,
    setPagoField,
    medioSeleccionado,
    requiereComprobante,
    enviando,
    finalizeOrder,
    showProfileModal,
    abrirPerfil,
    cerrarPerfil,
    saveProfile,
  };

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}
