import { useEffect, useRef, useState } from 'react';
import { Api } from '../../lib/api';
import { money } from './helpers';

const CHART_CDN = 'https://cdn.jsdelivr.net/npm/chart.js';

export default function InicioView() {
  const [kpis, setKpis] = useState({ ingresos: 0, pedidos: 0, clientes: 0, ticket: 0 });
  const [cargando, setCargando] = useState(true);
  const salesRef = useRef(null);
  const productsRef = useRef(null);
  const charts = useRef([]);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const hoy = new Date().toISOString().slice(0, 10);
        const hace7 = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

        const [pedidosHoy, facturasHoy, clientes, facturas7, pedidos7] = await Promise.all([
          Api.get('/pedidos', { fecha_desde: hoy, per_page: 100 }),
          Api.get('/factura-ventas', { fecha_desde: hoy, per_page: 100 }),
          Api.get('/usuarios', { rol: 'cliente', per_page: 1 }),
          Api.get('/factura-ventas', { fecha_desde: hace7, per_page: 100 }),
          Api.get('/pedidos', { fecha_desde: hace7, per_page: 100 }),
        ]);

        const pedidos = Api.unwrapList(pedidosHoy).items;
        const facturas = Api.unwrapList(facturasHoy).items;
        const ingresos = facturas.reduce((s, f) => s + Number(f.total || 0), 0);
        const totalClientes = Api.unwrapList(clientes).meta?.total || 0;

        if (activo) {
          setKpis({
            ingresos,
            pedidos: pedidos.length,
            clientes: totalClientes,
            ticket: pedidos.length ? ingresos / pedidos.length : 0,
          });
          dibujarCharts(Api.unwrapList(facturas7).items, Api.unwrapList(pedidos7).items);
          setCargando(false);
        }
      } catch (err) {
        if (activo) {
          alert('❌ ' + Api.firstError(err));
          setCargando(false);
        }
      }
    }

    function dibujarCharts(facturas7, pedidos7) {
      if (!window.Chart) {
        setTimeout(() => dibujarCharts(facturas7, pedidos7), 300);
        return;
      }
      const dias = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        dias.push({
          key: d.toISOString().slice(0, 10),
          label: d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        });
      }
      const ingresosDias = dias.map((d) =>
        facturas7.filter((f) => (f.fecha_emision || f.created_at || '').slice(0, 10) === d.key).reduce((s, f) => s + Number(f.total || 0), 0),
      );

      charts.current.forEach((c) => c.destroy());
      charts.current = [];

      if (salesRef.current) {
        charts.current.push(new window.Chart(salesRef.current, {
          type: 'line',
          data: {
            labels: dias.map((d) => d.label),
            datasets: [{ label: 'Ingresos ($)', data: ingresosDias, borderColor: '#39A900', backgroundColor: 'rgba(57,169,0,0.10)', tension: 0.4, fill: true }],
          },
          options: { responsive: true, maintainAspectRatio: false },
        }));
      }

      const top = {};
      pedidos7.forEach((p) => {
        (p.detalles || []).forEach((d) => {
          const nombre = d.producto?.nombre || 'Otro';
          top[nombre] = (top[nombre] || 0) + Number(d.cantidad || 0);
        });
      });
      const ordenado = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);

      if (productsRef.current) {
        charts.current.push(new window.Chart(productsRef.current, {
          type: 'doughnut',
          data: {
            labels: ordenado.map((e) => e[0]),
            datasets: [{ data: ordenado.map((e) => e[1]), backgroundColor: ['#39A900', '#4DBD8B', '#6BCF9E', '#8fd3b8', '#c9e8d8'] }],
          },
          options: { responsive: true, maintainAspectRatio: false },
        }));
      }
    }

    if (!document.querySelector('script[data-chartjs]')) {
      const script = document.createElement('script');
      script.src = CHART_CDN;
      script.async = true;
      script.dataset.chartjs = '1';
      document.head.appendChild(script);
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => () => charts.current.forEach((c) => c.destroy()), []);

  if (cargando) {
    return (
      <div className="page show">
        <p className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>Cargando indicadores…</p>
      </div>
    );
  }

  return (
    <div className="page show">
      <div className="cards-grid">
        <div className="card">
          <div className="card-head"><h3>Ingresos Hoy</h3><i className="fa-solid fa-coins" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}></i></div>
          <div className="card-val">{money(kpis.ingresos)}</div>
          <div className="card-trend"><i className="fa-solid fa-circle-info"></i> Según facturas del día</div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Pedidos Hoy</h3><i className="fa-solid fa-receipt" style={{ fontSize: '1.4rem', color: 'var(--warning)' }}></i></div>
          <div className="card-val">{kpis.pedidos}</div>
          <div className="card-trend"><i className="fa-solid fa-circle-info"></i> Creados hoy</div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Clientes Registrados</h3><i className="fa-solid fa-user-plus" style={{ fontSize: '1.4rem', color: 'var(--info)' }}></i></div>
          <div className="card-val">{kpis.clientes}</div>
          <div className="card-trend"><i className="fa-solid fa-circle-info"></i> Rol cliente</div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Ticket Promedio</h3><i className="fa-solid fa-credit-card" style={{ fontSize: '1.4rem', color: 'var(--success)' }}></i></div>
          <div className="card-val">{money(kpis.ticket)}</div>
          <div className="card-trend"><i className="fa-solid fa-circle-info"></i> Ingreso / pedidos</div>
        </div>
      </div>
      <div className="charts-grid">
        <div className="box">
          <div className="box-top"><h3><i className="fa-solid fa-chart-line"></i> Ingresos Últimos 7 Días</h3></div>
          <div style={{ position: 'relative', height: '250px' }}><canvas ref={salesRef}></canvas></div>
        </div>
        <div className="box">
          <div className="box-top"><h3><i className="fa-solid fa-chart-pie"></i> Productos Más Vendidos</h3></div>
          <div style={{ position: 'relative', height: '250px' }}><canvas ref={productsRef}></canvas></div>
        </div>
      </div>
    </div>
  );
}
