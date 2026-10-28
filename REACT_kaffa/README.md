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
| HTTP | Axios (instancia centralizada) |

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

## Despliegue con Docker

En producción la SPA se compila dentro del VPS y Nginx la sirve en el mismo origen que la API (`http://IP/` y `http://IP/api/v1`). El `Dockerfile` de esta carpeta construye `dist/` con Node 22 + pnpm y lo copia a Nginx. El runbook completo está en [`../../backend-kaffa/deploy/README-DESPLIEGUE.md`](../../backend-kaffa/deploy/README-DESPLIEGUE.md).

## Variables de entorno

Copia `.env.example` a `.env.local` (este último no se versiona):

```env
VITE_API_URL=/api/v1
VITE_CLOUDINARY_CLOUD_NAME=roffd6et
VITE_CLOUDINARY_UPLOAD_PRESET=KAFFACCYS
```

Las imágenes se suben **directamente a Cloudinary** desde el navegador (upload preset *unsigned*, carpeta `samples/ecommerce` definida en el preset). `cloud_name` y `upload_preset` son públicos por diseño; nunca se usa el API secret en el frontend.

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
├── components/       Layout (navbar+footer), RequireRole (guard), ClienteWidgets (carrito/pago/perfil), ProductCard, media (ImageUpload/CloudinaryImage), ErrorBoundary
├── context/          CarritoContext
├── hooks/            useCatalogo, useEquipo, useChatNoLeidos, useStyles, useDashboardTheme…
├── lib/              axiosClient.js (Axios + Bearer + 401), api.js (fachada API), apiError.js, auth.js (login/registro/roles), storage, toast, utils, cloudinary.js, styleManifest.js
├── data/             catálogo demo (si la API no responde)
└── styles/           variables.css (tema claro/oscuro)
public/css/           hojas de estilo cargadas en caliente por página (stylesManager.js)
```

## Flujo CSS

- **Globales:** `src/styles/variables.css` (tokens de tema claro/oscuro) e `src/index.css` (ajustes base de la SPA) se importan una sola vez en `src/main.jsx`.
- **Por ruta:** las hojas de `public/css/` se cargan en caliente con `useStyles()` y `stylesManager.js`. Cada layout/página declara su grupo mediante las constantes de `src/lib/styleManifest.js`; el `<link>` se elimina al desmontar la ruta.
- **Mapa actual:**

| Constante | Hojas | Rutas/componentes |
|-----------|-------|-------------------|
| `PUBLIC` | `style.css` | Layout y páginas públicas |
| `DASHBOARD_ADMIN` | `dashboard-base.css`, `dashboard-admin.css` | Panel admin |
| `DASHBOARD_BARISTA` | `dashboard-base.css`, `dashboard.css` | Panel barista |
| `CLIENTE_HOME` | `cliente-home.css` | Mis pedidos y chat del cliente |
| `PROMOCIONES` | `promociones.css` | Vista admin de promociones |

- **Convención:** los features nuevos o refactorizados usan `*.module.css` co-localizado junto al componente. `public/css/` queda como capa legacy y se va vaciando por feature. No añadir hojas nuevas a `public/css/` ni estilos globales nuevos salvo tokens/reset.
- **Ya migrados a CSS Modules:** autenticación (`src/pages/auth.module.css`), pop-up/carrusel de promociones (`src/components/promociones/promociones.module.css`) y widgets del cliente (`src/components/cliente/clienteWidgets.module.css`).

## Detalles funcionales clave

- **Token** en `localStorage` (`kaffaToken`); 401 ⇒ limpia sesión y el guard redirige a `/login`.
- Redirección tras login por rol: admin → `/admin-dashboard`, barista → `/barista-dashboard`, cliente → sitio público.
- Baristas: acciones bloqueadas **sin turno activo** (badge de turno con minutos restantes; sondeo 60 s).
- Medios de pago virtuales exigen **imagen de comprobante** (se sube directamente a Cloudinary con `lib/cloudinary.js`).
- Sondeo: pedidos 10 s, chat 5 s, inventario 15 s, caja 30 s.
- **Asistente IA** (solo admin): chat estilo Messenger en el panel (`AsistenteView.jsx`) que analiza ventas, predice y sugiere marketing; historial persistente en el backend y texto escapado antes de renderizar.
- **Catálogo real desde la API**: si el administrador no ha creado productos, el Home no muestra la sección de favoritos y el Menú muestra un estado vacío. No se usa catálogo demo en la vista pública.
- **Favoritos** en `localStorage` (`kaffaFavoritos`): corazón en cada tarjeta y en el navbar/sidebar; la sección “Tus Favoritos” del Home solo aparece cuando el usuario tiene favoritos.

## Pruebas

No hay suite automatizada de frontend. Verificación: `npm run lint`, `npm run build` y recorrido manual de rutas públicas, auth, admin y barista (incluyendo tema claro/oscuro y revisar en DevTools que no se dupliquen hojas CSS). Ver `../../docs/08-pruebas.md`.

## Manual de uso

El manual interactivo se publica como sitio estático en `public/manual/` y se sirve en:

```text
/manual/index.html
```

Se abre en una pestaña nueva desde el home, el footer, el login y los paneles de barista/administrador.

Para actualizarlo después de regenerar el manual:

```bash
pnpm manual:sync   # copia docs/manual-frontend/dist → public/manual
pnpm build         # lo incluye en dist/manual
```

No edites `public/manual` a mano: es una copia generada. El editor de puntos (`editor.html`) no se publica.

Más detalles de despliegue y limpieza de cuentas demo: [`../../docs/manual-frontend/PUBLICACION.md`](../../docs/manual-frontend/PUBLICACION.md).
