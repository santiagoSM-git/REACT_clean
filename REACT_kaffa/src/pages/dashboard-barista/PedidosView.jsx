import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import { useBarista } from './BaristaContext.jsx';
import { fechaHora, getJsPDF, itemsPedido, money } from './helpers';

export default function PedidosView() {
  const { turno } = useBarista();
  const [pedidos, setPedidos] = useState([]);
  const [medios, setMedios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [contactos, setContactos] = useState([]);

  // Modales
  const [cobrarPedido, setCobrarPedido] = useState(null); // { pedido, medio_id, monto, comprobante }
  const [nuevoPedido, setNuevoPedido] = useState(null); // { cliente_id, estado, detalles: [], pagos: [] }
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const resp = await Api.get('/pedidos', { per_page: 100 });
      setPedidos(Api.unwrapList(resp).items);
    } catch {
      /* se reintenta con el polling */
    }
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Api.get('/medios-pago', { per_page: 100 })
      .then((resp) => setMedios(Api.unwrapList(resp).items))
      .catch(() => {});
  }, []);

  const turnoActivo = turno?.turno_activo && turno?.turno_info;

  // ── Pagos previos del pedido (para evitar doble cobro) ──
  const pagadoTotal = (p) => (p.pagos || []).reduce((s, pg) => s + Number(pg.monto || 0), 0);

  const abrirCobro = (p) => {
    setCobrarPedido({ pedido: p, medio_id: medios[0]?.id || '', monto: p.total ?? '', comprobante: '' });
  };

  const confirmarCobro = async () => {
    const { pedido, medio_id, monto, comprobante } = cobrarPedido;
    const montoNum = Number(monto);
    const medio = medios.find((m) => m.id == medio_id);

    if (!medio_id) return alert('Selecciona un medio de pago');
    if (!(montoNum > 0)) return alert('Monto inválido');
    if (medio?.es_virtual && !comprobante.trim()) return alert('El medio virtual requiere la URL del comprobante.');

    setSaving(true);
    try {
      const pagosPrevios = pagadoTotal(pedido);
      const necesitaPago = Math.abs(pagosPrevios - Number(pedido.total || 0)) > 0.01;

      if (necesitaPago) {
        const pagoBody = { pedido_id: pedido.id, medio_pago_id: Number(medio_id), monto: montoNum };
        if (comprobante.trim()) pagoBody.comprobante_url = comprobante.trim();
        await Api.post('/pago-pedidos', pagoBody);
      }
      await Api.put('/pedidos/' + pedido.id, { estado: 'pagado' });
      setCobrarPedido(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.turnoMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await Api.put('/pedidos/' + id, { estado });
      cargar();
    } catch (err) {
      alert('❌ ' + Api.turnoMessage(err));
    }
  };

  const entregar = (id) => cambiarEstado(id, 'entregado');

  const cancelar = (id) => {
    if (!window.confirm(`¿Cancelar el pedido #${id}?`)) return;
    cambiarEstado(id, 'cancelado');
  };

  // ── Nuevo pedido (mostrador) ──
  const abrirNuevoPedido = async () => {
    try {
      const [pResp, cResp] = await Promise.all([
        Api.get('/productos', { per_page: 100, activo: 1 }),
        Api.get('/mensajes/contactos'),
      ]);
      setProductos(Api.unwrapList(pResp).items);
      setContactos(cResp || []);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
      return;
    }
    setNuevoPedido({
      cliente_id: '',
      estado: 'pendiente',
      detalles: [{ producto_id: productos[0]?.id || '', cantidad: 1 }],
      pagos: [],
    });
  };

  const guardarPedido = async () => {
    const detalles = nuevoPedido.detalles
      .map((d) => {
        const prod = productos.find((p) => p.id == d.producto_id);
        const cantidad = Number(d.cantidad) || 0;
        const precio = Number(prod?.precio_venta) || 0;
        return { producto_id: Number(d.producto_id), cantidad, precio_unitario: precio, subtotal: precio * cantidad };
      })
      .filter((d) => d.producto_id && d.cantidad > 0);

    if (!detalles.length) return alert('Agrega al menos un producto.');

    const pagos = nuevoPedido.pagos
      .map((p) => {
        const pago = { medio_pago_id: Number(p.medio_pago_id), monto: Number(p.monto) };
        if (p.comprobante.trim()) pago.comprobante_url = p.comprobante.trim();
        return pago;
      })
      .filter((p) => p.medio_pago_id && p.monto > 0);

    const total = detalles.reduce((s, d) => s + (d.subtotal || 0), 0);
    const body = { estado: nuevoPedido.estado, total, detalles, pagos };
    if (nuevoPedido.cliente_id) body.cliente_id = Number(nuevoPedido.cliente_id);

    setSaving(true);
    try {
      await Api.post('/pedidos', body);
      setNuevoPedido(null);
      cargar();
    } catch (err) {
      alert('❌ ' + Api.turnoMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Factura PDF ──
  const imprimirFactura = async (id) => {
    const p = pedidos.find((x) => x.id === id);
    if (!p) return;
    const jsPDF = await getJsPDF();
    if (!jsPDF) return;

    const factura = p.factura_venta;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] });

    doc.setFontSize(14);
    doc.text('KAFFA CAFÉ', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Factura de Venta' + (factura ? ' ' + factura.numero_factura : ''), 40, 16, { align: 'center' });
    doc.text('─────────────────────', 40, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.text('Pedido: #' + p.id, 5, 28);
    doc.text('Cliente: ' + (p.cliente?.nombre || 'Mostrador'), 5, 34);
    doc.text('Fecha: ' + new Date().toLocaleDateString('es-CO'), 5, 40);
    doc.text('─────────────────────', 40, 46, { align: 'center' });

    let y = 52;
    itemsPedido(p).forEach((i) => {
      doc.text(i.cant + 'x ' + i.nombre.substring(0, 35), 5, y);
      y += 5;
    });

    doc.text('─────────────────────', 40, y + 2, { align: 'center' });
    doc.setFontSize(11);
    doc.text('TOTAL: ' + money(p.total), 40, y + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text('¡Gracias por tu compra!', 40, y + 18, { align: 'center' });

    doc.save('factura_pedido_' + p.id + '.pdf');
  };

  const descargarHistorialPDF = async () => {
    const entregados = pedidos.filter((p) => p.estado === 'entregado');
    if (entregados.length === 0) return alert('No hay pedidos entregados en este turno.');

    const jsPDF = await getJsPDF();
    if (!jsPDF) return;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(107, 76, 53);
    doc.text('KAFFA CAFÉ', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Historial de Pedidos Entregados', 105, 30, { align: 'center' });
    doc.text('Fecha: ' + new Date().toLocaleDateString('es-CO'), 105, 38, { align: 'center' });
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
    entregados.forEach((p) => {
      totalGeneral += Number(p.total) || 0;
      const itemsTexto = itemsPedido(p).map((i) => i.cant + 'x').join(', ');
      doc.text('#' + p.id, 20, y);
      doc.text((p.cliente?.nombre || 'Mostrador').substring(0, 20), 50, y);
      doc.text(itemsTexto.substring(0, 30), 90, y);
      doc.text(money(p.total), 160, y);
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
    doc.text('Total Entregado: ' + money(totalGeneral), 160, y + 12, { align: 'right' });
    doc.text('Pedidos: ' + entregados.length, 20, y + 12);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Generado automáticamente por Sistema Kaffa', 105, 285, { align: 'center' });
    doc.save('historial_entregados_' + new Date().toISOString().slice(0, 10) + '.pdf');
  };

  const solicitudes = pedidos.filter((p) => (p.estado || 'pendiente') === 'pendiente');
  const preparacion = pedidos.filter((p) => p.estado === 'pagado');
  const entregados = pedidos.filter((p) => p.estado === 'entregado' || p.estado === 'cancelado');

  const renderContenido = (p) => {
    const metodo = (p.pagos || []).map((pg) => pg.medio_pago?.nombre || 'Pago').join(', ') || 'Sin pagar';
    return (
      <div className="ticket-content">
        <div className="ticket-header">
          <span className="ticket-id">#{p.id}</span>
          <span className="ticket-time">{fechaHora(p.created_at)}</span>
        </div>
        <div className="ticket-cliente">{p.cliente?.nombre || 'Mostrador'}</div>
        <div className="ticket-items">
          {itemsPedido(p).map((i, idx) => (
            <div className="ticket-item" key={idx}>
              <span className="ticket-item-name">{i.nombre}</span>
              <span className="ticket-item-qty">{i.cant}</span>
              {i.nota && (
                <div className="ticket-item-note">
                  <i className="fa-solid fa-note-sticky"></i> {i.nota}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ticket-footer">
          <span className="ticket-total">{money(p.total)}</span>
          <span className="ticket-metodo">{p.estado === 'cancelado' ? 'Cancelado' : metodo}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="content-section active" id="pedidos">
      <div className="turno-indicator">
        <h2>
          <i className="fa-solid fa-coffee"></i> PEDIDOS TURNO{' '}
          <span>{turnoActivo ? turno.turno_info.tipo.toUpperCase() : '—'}</span>
        </h2>
        <span className={`turno-badge ${turnoActivo ? 'activo' : 'cerrado'}`}>
          <i className="fa-solid fa-circle"></i> {turnoActivo ? `ACTIVO · ${turno.turno_info.minutos_restantes} min` : 'SIN TURNO'}
        </span>
        <button className="btn-primary" onClick={abrirNuevoPedido} style={{ marginLeft: 'auto' }}>
          <i className="fa-solid fa-plus"></i> Registrar Pedido
        </button>
      </div>

      {!turnoActivo && (
        <p className="text-muted" style={{ margin: '8px 0', fontSize: '13px' }}>
          <i className="fa-solid fa-circle-info"></i> Sin turno activo no puedes cobrar ni cambiar estados (regla del backend).
          Si estás en horario (07:00–18:00) y no tienes turno, pide al administrador que te asigne uno.
        </p>
      )}

      <div className="kanban-board">
        <div className="kanban-column solicitudes">
          <div className="kanban-column-header">
            <span><i className="fa-solid fa-inbox"></i> Solicitudes (Pendiente)</span>
            <span className="kanban-column-count">{solicitudes.length}</span>
          </div>
          <div className="kanban-column-body">
            {solicitudes.map((p) => (
              <div className="ticket-card" key={p.id}>
                {renderContenido(p)}
                <div className="ticket-actions">
                  <button className="btn-ticket btn-verificar" onClick={() => abrirCobro(p)} disabled={!turnoActivo}>
                    <i className="fa-solid fa-hand-holding-dollar"></i> {pagadoTotal(p) > 0 ? 'CONFIRMAR PAGO' : 'COBRAR'}
                  </button>
                  <button className="btn-ticket btn-cancelar" onClick={() => cancelar(p.id)} disabled={!turnoActivo}>
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              </div>
            ))}
            {solicitudes.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: '16px' }}>Sin solicitudes</p>}
          </div>
        </div>

        <div className="kanban-column preparacion">
          <div className="kanban-column-header">
            <span><i className="fa-solid fa-blender"></i> Pagado / Preparación</span>
            <span className="kanban-column-count">{preparacion.length}</span>
          </div>
          <div className="kanban-column-body">
            {preparacion.map((p) => (
              <div className="ticket-card" key={p.id}>
                {renderContenido(p)}
                <div className="ticket-actions">
                  <button className="btn-ticket btn-entregar" onClick={() => entregar(p.id)} disabled={!turnoActivo}>
                    <i className="fa-solid fa-hand-holding"></i> ENTREGAR
                  </button>
                  <button className="btn-ticket btn-cancelar" onClick={() => cancelar(p.id)} disabled={!turnoActivo}>
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              </div>
            ))}
            {preparacion.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: '16px' }}>Nada en preparación</p>}
          </div>
        </div>

        <div className="kanban-column entregados">
          <div className="kanban-column-header">
            <span><i className="fa-solid fa-check-circle"></i> Entregados / Cancelados</span>
            <span className="kanban-column-count">{entregados.length}</span>
          </div>
          <div className="kanban-column-body">
            {entregados.map((p) => (
              <div className="ticket-card" key={p.id}>
                {renderContenido(p)}
                {p.estado === 'entregado' && (
                  <div className="ticket-actions">
                    <button className="btn-ticket btn-factura" onClick={() => imprimirFactura(p.id)}>
                      <i className="fa-solid fa-receipt"></i> FACTURA PDF
                    </button>
                  </div>
                )}
              </div>
            ))}
            {entregados.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: '16px' }}>Sin entregados</p>}
          </div>
          <button className="btn-download-pdf" onClick={descargarHistorialPDF}>
            <i className="fa-solid fa-file-pdf"></i> Descargar Historial
          </button>
        </div>
      </div>

      {/* MODAL COBRAR */}
      {cobrarPedido && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setCobrarPedido(null)}>&times;</button>
            <h2><i className="fa-solid fa-coins"></i> {pagadoTotal(cobrarPedido.pedido) > 0 ? 'Confirmar Pago' : 'Registrar Pago'}</h2>
            <p className="text-muted">
              Pedido #{cobrarPedido.pedido.id} · Total: <b>{money(cobrarPedido.pedido.total)}</b>
            </p>
            {(cobrarPedido.pedido.pagos || []).length > 0 && (
              <div style={{ background: 'var(--surface-alt)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                <b>Pagos enviados por el cliente:</b>
                {cobrarPedido.pedido.pagos.map((pg, i) => (
                  <p key={i} style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                    {pg.medio_pago?.nombre}: {money(pg.monto)}{' '}
                    {pg.comprobante_url && <a href={pg.comprobante_url} target="_blank" rel="noreferrer">ver comprobante</a>}
                  </p>
                ))}
              </div>
            )}
            {Math.abs(pagadoTotal(cobrarPedido.pedido) - Number(cobrarPedido.pedido.total || 0)) > 0.01 && (
              <>
                <div className="form-group">
                  <label>Medio de Pago</label>
                  <select value={cobrarPedido.medio_id} onChange={(e) => setCobrarPedido((c) => ({ ...c, medio_id: e.target.value }))}>
                    {medios.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}{m.es_virtual ? ' (virtual)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto</label>
                  <input type="number" min="0.01" step="0.01" value={cobrarPedido.monto} onChange={(e) => setCobrarPedido((c) => ({ ...c, monto: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>URL Comprobante (medio virtual)</label>
                  <input type="text" placeholder="https://..." value={cobrarPedido.comprobante} onChange={(e) => setCobrarPedido((c) => ({ ...c, comprobante: e.target.value }))} />
                </div>
              </>
            )}
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setCobrarPedido(null)}>Cancelar</button>
              <button className="btn-primary" onClick={confirmarCobro} disabled={saving}>
                <i className="fa-solid fa-check"></i> {saving ? 'Procesando…' : 'Pasar a preparación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PEDIDO */}
      {nuevoPedido && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <button className="modal-close" onClick={() => setNuevoPedido(null)}>&times;</button>
            <h2><i className="fa-solid fa-clipboard-list"></i> Registrar Pedido</h2>

            <div className="form-group">
              <label>Cliente (opcional)</label>
              <select value={nuevoPedido.cliente_id} onChange={(e) => setNuevoPedido((n) => ({ ...n, cliente_id: e.target.value }))}>
                <option value="">Sin cliente (mostrador)</option>
                {contactos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre || c.correo}</option>
                ))}
              </select>
            </div>

            <h4 style={{ margin: '4px 0' }}><i className="fa-solid fa-mug-hot"></i> Productos</h4>
            {nuevoPedido.detalles.map((d, idx) => {
              const prod = productos.find((p) => p.id == d.producto_id);
              return (
                <div className="form-row-dynamic" key={idx} style={{ marginBottom: '6px' }}>
                  <select style={{ flex: 2 }} value={d.producto_id} onChange={(e) => setNuevoPedido((n) => ({ ...n, detalles: n.detalles.map((x, i) => (i === idx ? { ...x, producto_id: e.target.value } : x)) }))}>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} ({money(p.precio_venta)})</option>
                    ))}
                  </select>
                  <input type="number" min="1" style={{ flex: '0 0 80px' }} value={d.cantidad} onChange={(e) => setNuevoPedido((n) => ({ ...n, detalles: n.detalles.map((x, i) => (i === idx ? { ...x, cantidad: e.target.value } : x)) }))} />
                  {prod && <span style={{ alignSelf: 'center', fontSize: '13px', minWidth: '90px', textAlign: 'right' }}>{money((Number(prod.precio_venta) || 0) * (Number(d.cantidad) || 0))}</span>}
                  <button type="button" className="btn-icon delete" onClick={() => setNuevoPedido((n) => ({ ...n, detalles: n.detalles.filter((_, i) => i !== idx) }))}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              );
            })}
            <button type="button" className="btn-secondary" style={{ marginTop: '8px' }} onClick={() => setNuevoPedido((n) => ({ ...n, detalles: [...n.detalles, { producto_id: productos[0]?.id || '', cantidad: 1 }] }))}>
              <i className="fa-solid fa-plus"></i> Agregar producto
            </button>

            <h4 style={{ margin: '12px 0 4px' }}><i className="fa-solid fa-coins"></i> Pagos</h4>
            {nuevoPedido.pagos.map((p, idx) => (
              <div className="form-row-dynamic" key={idx} style={{ marginBottom: '6px' }}>
                <select style={{ flex: 2 }} value={p.medio_pago_id} onChange={(e) => setNuevoPedido((n) => ({ ...n, pagos: n.pagos.map((x, i) => (i === idx ? { ...x, medio_pago_id: e.target.value } : x)) }))}>
                  {medios.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}{m.es_virtual ? ' (virtual)' : ''}</option>
                  ))}
                </select>
                <input type="number" min="0.01" step="0.01" placeholder="Monto" style={{ flex: 1 }} value={p.monto} onChange={(e) => setNuevoPedido((n) => ({ ...n, pagos: n.pagos.map((x, i) => (i === idx ? { ...x, monto: e.target.value } : x)) }))} />
                <input type="text" placeholder="URL comprobante (si virtual)" style={{ flex: 1 }} value={p.comprobante} onChange={(e) => setNuevoPedido((n) => ({ ...n, pagos: n.pagos.map((x, i) => (i === idx ? { ...x, comprobante: e.target.value } : x)) }))} />
                <button type="button" className="btn-icon delete" onClick={() => setNuevoPedido((n) => ({ ...n, pagos: n.pagos.filter((_, i) => i !== idx) }))}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary" style={{ marginTop: '8px' }} onClick={() => setNuevoPedido((n) => ({ ...n, pagos: [...n.pagos, { medio_pago_id: medios[0]?.id || '', monto: '', comprobante: '' }] }))}>
              <i className="fa-solid fa-plus"></i> Agregar pago
            </button>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Estado inicial</label>
              <select value={nuevoPedido.estado} onChange={(e) => setNuevoPedido((n) => ({ ...n, estado: e.target.value }))}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setNuevoPedido(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarPedido} disabled={saving || !turnoActivo}>
                <i className="fa-solid fa-floppy-disk"></i> Guardar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
