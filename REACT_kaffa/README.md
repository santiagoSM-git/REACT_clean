# KAFFA Frontend — SPA React del POS de Cafetería

SPA en **React 19 + Vite** para el sistema POS de la cafetería **KAFFA**. Consume la API Laravel (`../../backend-kaffa`) en `/api/v1` con tokens Bearer.

- **Documentación técnica completa**: [`../../docs/README.md`](../../docs/README.md) — arquitectura, manual de usuario por rol, API, seguridad e instalación.

## Stack

| Paquete | Versión |
|---------|---------|
| React / ReactDOM | 19.2.8 |
| React Router DOM | 7.18.2 |
| React Hook Form | 7.85+ |
| Sonner (toasts) | 2.x |
| Vite | 8.x |
| HTTP | `fetch` nativo (sin axios) |

CDNs en tiempo de ejecución: Chart.js (gráficas admin), jsPDF (recibos barista), Font Awesome 6, Google Fonts Poppins.

## Scripts

```bash
pnpm install    # gestor del proyecto (pnpm-lock.yaml es la fuente única)
pnpm dev        # http://localhost:5173 (proxy /api → http://localhost:8000)
pnpm build      # build de producción → dist/
pnpm lint       # ESLint
pnpm preview    # previsualizar el build
```

> En desarrollo, el backend debe estar corriendo (`php artisan serve` en `:8000`): la SPA llama la ruta relativa `/api/v1` y Vite la proxiexa (`vite.config.js`).

## Rutas de la aplicación

| Ruta | Acceso | Contenido |
|------|--------|-----------|
| `/`, `/menu`, `/eventos`, `/sobre-nosotros`, `/contacto` | público | Sitio comercial; «Sobre Nosotros» incluye el equipo por fecha/turno (`GET /equipo`) |
| `/login`, `/registro`, `/forgot-password`, `/reset-password`, `/verify-email` | público | Autenticación (registro con verificación de correo) |
| `/pedidos`, `/chat` | cliente | Mis pedidos y chat con barista/admin |
| `/barista-dashboard/{pedidos,inventario,chat,caja}` | barista | POS kanban (cobro con comprobante, recibos PDF), inventario + reportes de novedad, chat, caja con arqueo |
| `/admin-dashboard` | admin | Panel de 17 secciones: KPIs, pedidos (+CSV), productos, categorías, insumos, mermas, compras, proveedores, gastos, cajas, facturas, clientes, baristas, turnos, reportes, **asistente IA**, configuración (medios de pago/roles) |

## Estructura

```text
src/
├── pages/            públicas, auth, cliente, dashboard-admin (17 vistas), dashboard-barista (4 vistas)
├── components/       Layout (navbar+footer), RequireRole (guard), ClienteWidgets (carrito/pago/perfil), ProductCard, ErrorBoundary
├── context/          CarritoContext
├── hooks/            useCatalogo, useEquipo, useChatNoLeidos, useStyles, useDashboardTheme…
├── lib/              api.js (cliente fetch + Bearer + 401), auth.js (login/registro/roles), storage, toast, utils
├── data/             catálogo demo (si la API no responde)
└── styles/           variables.css (tema claro/oscuro)
public/css/           hojas de estilo cargadas en caliente por página (stylesManager.js)
```

## Detalles funcionales clave

- **Token** en `localStorage` (`kaffaToken`); 401 ⇒ limpia sesión y el guard redirige a `/login`.
- Redirección tras login por rol: admin → `/admin-dashboard`, barista → `/barista-dashboard`, cliente → sitio público.
- Baristas: acciones bloqueadas **sin turno activo** (badge de turno con minutos restantes; sondeo 60 s).
- Medios de pago virtuales exigen **imagen de comprobante** (se sube con `POST /comprobantes`).
- Sondeo: pedidos 10 s, chat 5 s, inventario 15 s, caja 30 s.
- **Asistente IA** (solo admin): chat estilo Messenger en el panel (`AsistenteView.jsx`) que analiza ventas, predice y sugiere marketing; historial persistente en el backend y texto escapado antes de renderizar.
- Catálogo demo de respaldo (no comprable) cuando la API está caída.

## Pruebas

No hay suite automatizada de frontend (solo `npm run lint`). Ver `../../docs/08-pruebas.md`.
