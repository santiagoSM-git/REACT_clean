/**
 * KAFFA - Mis Pedidos (página pública dentro del Layout)
 * Sección "pedidos" trasladada del antiguo DashboardCliente, con su polling.
 */
import { useEffect, useState } from 'react';
import { useStyles } from '../hooks/useStyles';
import { Api } from '../lib/api';
import { Auth } from '../lib/auth';
import { formatCurrency } from '../lib/utils';

const ESTADOS_CLIENTE = {
  pendiente: { label: 'Pendiente', color: '#f39c12', icon: <i className="fa-solid fa-hourglass-half"></i> },
  pagado: { label: 'Pagado · En preparación', color: '#3498db', icon: <i className="fa-solid fa-rotate"></i> },
  cancelado: { label: 'Cancelado', color: '#e74c3c', icon: <i className="fa-solid fa-ban"></i> },
  entregado: { label: 'Entregado', color: '#27ae60', icon: <i className="fa-solid fa-circle-check"></i> },
};

function MisPedidos() {
  useStyles(['cliente-home.css']);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const resp = await Api.get('/pedidos', { per_page: 50 });
        setOrders(Api.unwrapList(resp).items);
      } catch {
        /* sin token aún */
      }
    };
    loadHistory();
    const interval = setInterval(loadHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="featured cliente-home" style={{ paddingTop: '120px', minHeight: '70vh' }}>
      <div className="section-header">
        <span className="section-tag">{Auth.getCurrentUser()?.nombre || 'Cliente'}</span>
        <h2>Tus Pedidos</h2>
        <p>Segui el estado de tus pedidos en tiempo real.</p>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
        {orders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Sin pedidos todavía. ¡Armá tu carrito y ordená! ☕</p>
        ) : (
          orders.map((o) => {
            const st = ESTADOS_CLIENTE[o.estado] || ESTADOS_CLIENTE.pendiente;
            const items = (o.detalles || []).map((d) => (Number(d.cantidad) || 1) + 'x ' + (d.producto?.nombre || '—') + (d.nota ? ` (${d.nota})` : '')).join(', ');
            const pagos = (o.pagos || []).map((pg) => pg.medio_pago?.nombre || 'Pago').join(', ');
            return (
              <div key={o.id} className="pedido-card" style={{ borderLeft: `4px solid ${st.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>#{o.id}</b>
                  <span className="pedido-estado" style={{ background: st.color }}>
                    {st.icon} {st.label}
                  </span>
                </div>
                <p style={{ fontSize: '13px', margin: '10px 0', color: 'var(--text-muted, #6b8a5e)' }}>{items || '—'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted, #6b8a5e)' }}>{pagos || 'Pago en mostrador'}</span>
                  <b style={{ color: 'var(--primary, #39A900)' }}>{formatCurrency(o.total)}</b>
                </div>
                {o.factura_venta && (
                  <p style={{ fontSize: '12px', margin: '6px 0 0', color: 'var(--text-muted, #6b8a5e)' }}>
                    <i className="fa-solid fa-file-invoice"></i> {o.factura_venta.numero_factura}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default MisPedidos;
