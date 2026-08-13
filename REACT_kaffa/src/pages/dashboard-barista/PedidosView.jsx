import { useEffect, useState } from 'react';
import { useBarista } from './BaristaContext.jsx';
import {
  esPersonalizado,
  formatearPrecioMenu,
  getJsPDF,
  guardarPedidos,
  leerNotificaciones,
  obtenerPedidos,
  obtenerPersonalizaciones,
} from './helpers';

export default function PedidosView() {
  const { turno, setTurno } = useBarista();
  const [pedidos, setPedidos] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const refresh = () => setPedidos(obtenerPedidos());
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const verificarPedido = (id) => {
    const list = obtenerPedidos();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx].status = 'prep';
      list[idx].verificadoEn = new Date().toISOString();
      guardarPedidos(list);
      const notifs = leerNotificaciones();
      notifs.push({
        pedidoId: id,
        cliente: list[idx].cliente,
        mensaje: '¡Tu pedido está siendo preparado! ☕',
        tipo: 'preparacion',
        fecha: new Date().toISOString(),
      });
      localStorage.setItem('kaffaNotificaciones', JSON.stringify(notifs));
      setPedidos(list);
    }
  };

  const cancelarPedido = (id) => {
    if (!window.confirm('¿Cancelar este pedido? Esta acción no se puede deshacer.')) return;
    const list = obtenerPedidos();
    const pedido = list.find((p) => p.id === id);
    if (pedido && pedido.status !== 'pending') {
      alert('❌ No se puede cancelar un pedido que ya está en preparación.');
      return;
    }
    const nuevos = list.filter((p) => p.id !== id);
    guardarPedidos(nuevos);
    const notifs = leerNotificaciones();
    notifs.push({
      pedidoId: id,
      cliente: pedido?.cliente,
      mensaje: 'Tu pedido ha sido cancelado.',
      tipo: 'cancelado',
      fecha: new Date().toISOString(),
    });
    localStorage.setItem('kaffaNotificaciones', JSON.stringify(notifs));
    setPedidos(nuevos);
  };

  const entregarPedido = (id) => {
    const list = obtenerPedidos();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx].status = 'entregado';
      list[idx].entregadoEn = new Date().toISOString();
      const stored = JSON.parse(localStorage.getItem('kaffaTurno')) || null;
      if (stored) {
        stored.pedidosEntregados = stored.pedidosEntregados || [];
        stored.pedidosEntregados.push(list[idx]);
        setTurno(stored);
      }
      guardarPedidos(list);
      const notifs = leerNotificaciones();
      notifs.push({
        pedidoId: id,
        cliente: list[idx].cliente,
        mensaje: '¡Tu pedido está listo! Pasa a recogerlo 🎉',
        tipo: 'listo',
        fecha: new Date().toISOString(),
      });
      localStorage.setItem('kaffaNotificaciones', JSON.stringify(notifs));
      setPedidos(list);
    }
  };

  const imprimirFactura = async (id) => {
    const pedido = obtenerPedidos().find((p) => p.id === id);
    if (!pedido) return;
    const jsPDF = await getJsPDF();
    if (!jsPDF) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] });

    doc.setFontSize(14);
    doc.text('KAFFA CAFÉ', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Factura de Venta', 40, 16, { align: 'center' });
    doc.text('─────────────────────', 40, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Pedido: #${pedido.id}`, 5, 28);
    doc.text(`Cliente: ${pedido.cliente}`, 5, 34);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 5, 40);
    doc.text('─────────────────────', 40, 46, { align: 'center' });

    let y = 52;
    (pedido.items || []).forEach((item) => {
      const texto =
        typeof item === 'string'
          ? item
          : `${item.personalizacion?.cantidad || 1}x ${item.producto?.nombre}`;
      doc.text(texto.substring(0, 35), 5, y);
      y += 5;
    });

    doc.text('─────────────────────', 40, y + 2, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`TOTAL: ${formatearPrecioMenu(pedido.total)}`, 40, y + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text('¡Gracias por tu compra!', 40, y + 18, { align: 'center' });

    doc.save(`factura_${pedido.id}.pdf`);
  };

  const descargarHistorialPDF = async () => {
    const entregados = obtenerPedidos().filter((p) => p.status === 'entregado' || p.status === 'ready');
    if (entregados.length === 0) {
      alert('No hay pedidos entregados en este turno.');
      return;
    }
    const jsPDF = await getJsPDF();
    if (!jsPDF) return;
    const doc = new jsPDF();
    const t = JSON.parse(localStorage.getItem('kaffaTurno')) || null;

    doc.setFontSize(20);
    doc.setTextColor(107, 76, 53);
    doc.text('KAFFA CAFÉ', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Historial de Pedidos - Turno ${t?.tipo || 'AM'}`, 105, 30, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 105, 38, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    let y = 55;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('ID', 20, y);
    doc.text('Cliente', 50, y);
    doc.text('Items', 90, y);
    doc.text('Total', 160, y);
    doc.setFont(undefined, 'normal');
    y += 8;

    let totalGeneral = 0;
    entregados.forEach((pedido) => {
      const total =
        typeof pedido.total === 'string'
          ? parseFloat(pedido.total.replace('$', '').replace(',', ''))
          : pedido.total;
      totalGeneral += total || 0;
      const itemsTexto = (pedido.items || [])
        .map((i) => (typeof i === 'string' ? i.split(' ')[0] : `${i.personalizacion?.cantidad}x`))
        .join(', ');

      doc.text(pedido.id || '-', 20, y);
      doc.text((pedido.cliente || '-').substring(0, 20), 50, y);
      doc.text(itemsTexto.substring(0, 30), 90, y);
      doc.text(formatearPrecioMenu(pedido.total), 160, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total del Turno: ${formatearPrecioMenu(totalGeneral)}`, 160, y + 12, { align: 'right' });
    doc.text(`Pedidos Entregados: ${entregados.length}`, 20, y + 12);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Generado automáticamente por Sistema Kaffa', 105, 285, { align: 'center' });

    doc.save(`historial_turno_${t?.tipo || 'AM'}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const countdownFor = (pedido) => {
    const expiresAt = (pedido.timestamp || Date.now()) + 3 * 60 * 1000;
    const diff = expiresAt - now;
    const isDisabled = diff > 0;
    const time = isDisabled
      ? `${Math.floor(diff / 60000).toString().padStart(2, '0')}:${Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')}`
      : null;
    return { isDisabled, time, expiresAt };
  };

  const renderContenidoTarjeta = (pedido) => {
    const items = pedido.items || [];
    const fecha =
      pedido.time ||
      new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="ticket-content">
        <div className="ticket-header">
          <span className="ticket-id">#{pedido.id}</span>
          <span className="ticket-time">{fecha}</span>
        </div>
        <div className="ticket-cliente">{pedido.cliente || 'Cliente'}</div>
        <div className="ticket-items">
          {items.map((item, i) => {
            if (typeof item === 'string') {
              const match = item.match(/^(\d+)x\s*(.+)/);
              return (
                <div className="ticket-item" key={i}>
                  <span className="ticket-item-name">{match ? match[2] : item}</span>
                  <span className="ticket-item-qty">{match ? match[1] : '1'}</span>
                </div>
              );
            }
            return (
              <div className="ticket-item" key={i}>
                <span className="ticket-item-name">{item.producto?.nombre || 'Producto'}</span>
                <span className="ticket-item-qty">{item.personalizacion?.cantidad || 1}</span>
              </div>
            );
          })}
        </div>
        <div className="ticket-footer">
          <span className="ticket-total">{formatearPrecioMenu(pedido.total)}</span>
          <span className="ticket-metodo">{pedido.metodoPago || 'Efectivo'}</span>
        </div>
      </div>
    );
  };

  const solicitudes = pedidos.filter((p) => (p.status || 'pending') === 'pending');
  const preparacion = pedidos.filter((p) => p.status === 'prep');
  const entregados = pedidos.filter((p) => p.status === 'ready' || p.status === 'entregado');

  return (
    <div className="content-section active" id="pedidos">
      <div className="turno-indicator">
        <h2>
          <i className="fa-solid fa-coffee"></i> PEDIDOS TURNO{' '}
          <span id="turnoActual">{turno?.tipo || '—'}</span>
        </h2>
        <span className={`turno-badge ${turno ? 'activo' : 'cerrado'}`} id="turnoBadge">
          <i className="fa-solid fa-circle"></i> {turno ? 'ACTIVO' : 'CERRADO'}
        </span>
      </div>

      <div className="kanban-board">
        <div className="kanban-column solicitudes">
          <div className="kanban-column-header">
            <span>
              <i className="fa-solid fa-inbox"></i> Solicitudes
            </span>
            <span className="kanban-column-count">{solicitudes.length}</span>
          </div>
          <div className="kanban-column-body">
            {solicitudes.map((pedido) => {
              const personalizado = esPersonalizado(pedido);
              const { isDisabled, time } = countdownFor(pedido);
              const cd = (
                <div
                  className={`barista-countdown${isDisabled ? '' : ' ready'}`}
                  style={
                    isDisabled
                      ? undefined
                      : { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' }
                  }
                >
                  <i className="fa-solid fa-stopwatch"></i>{' '}
                  {isDisabled ? `Esperando al cliente: ${time}` : '¡Listo para confirmar! '}
                  {!isDisabled && <i className="fa-solid fa-circle-check"></i>}
                </div>
              );
              const contenido = renderContenidoTarjeta(pedido);

              if (personalizado) {
                return (
                  <div className="ticket-flip-container" key={pedido.id}>
                    <div className={`ticket-flip-inner${flipped[pedido.id] ? ' flipped' : ''}`}>
                      <div className="ticket-front">
                        <div
                          className="ticket-card personalizado"
                          onClick={() => setFlipped((f) => ({ ...f, [pedido.id]: !f[pedido.id] }))}
                        >
                          {cd}
                          {contenido}
                          <div className="ticket-actions">
                            <button
                              className="btn-ticket btn-verificar"
                              disabled={isDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                verificarPedido(pedido.id);
                              }}
                            >
                              <i className="fa-solid fa-check"></i> VERIFICADO
                            </button>
                            <button
                              className="btn-ticket btn-cancelar"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelarPedido(pedido.id);
                              }}
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="ticket-back">
                        <h4>
                          <i className="fa-solid fa-wand-magic-sparkles"></i> Personalización
                        </h4>
                        <ul className="personalizacion-list">
                          {obtenerPersonalizaciones(pedido).map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                        <button
                          className="btn-volver"
                          onClick={() => setFlipped((f) => ({ ...f, [pedido.id]: !f[pedido.id] }))}
                        >
                          <i className="fa-solid fa-arrow-left"></i> Volver
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div className="ticket-card" key={pedido.id}>
                  {cd}
                  {contenido}
                  <div className="ticket-actions">
                    <button className="btn-ticket btn-verificar" disabled={isDisabled} onClick={() => verificarPedido(pedido.id)}>
                      <i className="fa-solid fa-check"></i> VERIFICADO
                    </button>
                    <button className="btn-ticket btn-cancelar" onClick={() => cancelarPedido(pedido.id)}>
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="kanban-column preparacion">
          <div className="kanban-column-header">
            <span>
              <i className="fa-solid fa-blender"></i> En Preparación
            </span>
            <span className="kanban-column-count">{preparacion.length}</span>
          </div>
          <div className="kanban-column-body">
            {preparacion.map((pedido) => (
              <div className={`ticket-card${esPersonalizado(pedido) ? ' personalizado' : ''}`} key={pedido.id}>
                {renderContenidoTarjeta(pedido)}
                <div className="ticket-actions">
                  <button className="btn-ticket btn-entregar" onClick={() => entregarPedido(pedido.id)}>
                    <i className="fa-solid fa-hand-holding"></i> ENTREGAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="kanban-column entregados">
          <div className="kanban-column-header">
            <span>
              <i className="fa-solid fa-check-circle"></i> Entregados
            </span>
            <span className="kanban-column-count">{entregados.length}</span>
          </div>
          <div className="kanban-column-body">
            {entregados.map((pedido) => (
              <div className="ticket-card" key={pedido.id}>
                {renderContenidoTarjeta(pedido)}
                <div className="ticket-actions">
                  <button className="btn-ticket btn-factura" onClick={() => imprimirFactura(pedido.id)}>
                    <i className="fa-solid fa-receipt"></i> IMPRIMIR FACTURA
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-download-pdf" onClick={descargarHistorialPDF}>
            <i className="fa-solid fa-file-pdf"></i> Descargar Historial
          </button>
        </div>
      </div>
    </div>
  );
}
