/**
 * KAFFA - Base de datos simulada de productos de la cafetería
 * Portado desde js/productos-data.js a ES module.
 *
 * ESTRUCTURA DE CADA PRODUCTO:
 * {
 *   id, nombre, categoria, precio, descripcion, imagen,
 *   personalizacion: { tamanos, leches, extras }
 * }
 *
 * CATEGORÍAS: "Cafés", "Postres", "Snacks"
 */

export const productosData = [
  // ━━━━ CATEGORÍA: CAFÉS ━━━━
  {
    id: 1,
    nombre: 'Capuchino',
    categoria: 'Cafés',
    precio: 8000,
    descripcion:
      'Espresso con leche vaporizada y espuma cremosa. Un clásico italiano que combina el sabor intenso del café con la suavidad de la leche.',
    imagen: 'https://manualdecocina.com/wp-content/uploads/2024/03/Capuchino.jpg',
    personalizacion: {
      tamanos: [
        { nombre: 'Pequeño', precio: 0 },
        { nombre: 'Mediano', precio: 1000 },
        { nombre: 'Grande', precio: 2000 },
      ],
      leches: ['Normal', 'Deslactosada', 'Almendra', 'Soya'],
      extras: [
        { nombre: 'Shot extra de café', precio: 1500 },
        { nombre: 'Crema batida', precio: 1000 },
        { nombre: 'Jarabe de vainilla', precio: 800 },
        { nombre: 'Jarabe de caramelo', precio: 800 },
        { nombre: 'Canela en polvo', precio: 0 },
      ],
    },
  },

  {
    id: 2,
    nombre: 'Latte',
    categoria: 'Cafés',
    precio: 7500,
    descripcion:
      'Café espresso con abundante leche vaporizada y una fina capa de espuma. Suave y cremoso, perfecto para cualquier momento del día.',
    imagen: 'https://www.homegrounds.co/wp-content/uploads/2019/09/latte-coffee-recipe.jpeg',
    personalizacion: {
      tamanos: [
        { nombre: 'Pequeño', precio: 0 },
        { nombre: 'Mediano', precio: 1000 },
        { nombre: 'Grande', precio: 2000 },
      ],
      leches: ['Normal', 'Deslactosada', 'Almendra', 'Soya'],
      extras: [
        { nombre: 'Shot extra de café', precio: 1500 },
        { nombre: 'Crema batida', precio: 1000 },
        { nombre: 'Jarabe de vainilla', precio: 800 },
        { nombre: 'Jarabe de caramelo', precio: 800 },
        { nombre: 'Jarabe de avellana', precio: 800 },
      ],
    },
  },

  {
    id: 3,
    nombre: 'Mocha',
    categoria: 'Cafés',
    precio: 9000,
    descripcion:
      'La combinación perfecta de espresso, chocolate y leche vaporizada. Coronado con crema batida para los amantes del chocolate.',
    imagen: 'https://thegoldenlamb.com/wp-content/uploads/2023/07/what-is-a-mocha-1024x640.jpg',
    personalizacion: {
      tamanos: [
        { nombre: 'Pequeño', precio: 0 },
        { nombre: 'Mediano', precio: 1000 },
        { nombre: 'Grande', precio: 2000 },
      ],
      leches: ['Normal', 'Deslactosada', 'Almendra', 'Soya'],
      extras: [
        { nombre: 'Shot extra de café', precio: 1500 },
        { nombre: 'Crema batida', precio: 1000 },
        { nombre: 'Chocolate extra', precio: 1200 },
        { nombre: 'Chispas de chocolate', precio: 800 },
        { nombre: 'Jarabe de menta', precio: 800 },
      ],
    },
  },

  {
    id: 4,
    nombre: 'Americano',
    categoria: 'Cafés',
    precio: 6000,
    descripcion:
      'Espresso diluido con agua caliente. Intenso y aromático, ideal para quienes prefieren un café más suave pero con todo el sabor.',
    imagen:
      'https://imgs.search.brave.com/x15FBhzmUJ4WiPb2Thlsy_anbevvOypqchUgMMjRiIU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMjkv/ODQzLzQ2Ni9zbWFs/bC9jdXAtb2YtYW1l/cmljYW5vLWJsYWNr/LWNvZmZlZS1pbi1y/ZXN0YXVyYW50LWNh/ZmUtaW4tbWV4aWNv/LXBob3RvLmpwZw',
    personalizacion: {
      tamanos: [
        { nombre: 'Pequeño', precio: 0 },
        { nombre: 'Mediano', precio: 1000 },
        { nombre: 'Grande', precio: 2000 },
      ],
      leches: ['Sin leche', 'Normal', 'Deslactosada'],
      extras: [
        { nombre: 'Shot extra de café', precio: 1500 },
        { nombre: 'Jarabe de vainilla', precio: 800 },
        { nombre: 'Jarabe de caramelo', precio: 800 },
      ],
    },
  },

  // ━━━━ CATEGORÍA: POSTRES ━━━━
  {
    id: 5,
    nombre: 'Brownie',
    categoria: 'Postres',
    precio: 6000,
    descripcion:
      'Brownie de chocolate belga, húmedo y con trozos de nueces. Servido tibio con una bola de helado de vainilla.',
    imagen: 'https://tse4.mm.bing.net/th/id/OIP.j25X47euW79mU8V5F_AXBgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    personalizacion: {
      tamanos: [
        { nombre: 'Individual', precio: 0 },
        { nombre: 'Doble', precio: 4000 },
      ],
      leches: [],
      extras: [
        { nombre: 'Helado de vainilla', precio: 2000 },
        { nombre: 'Helado de chocolate', precio: 2000 },
        { nombre: 'Salsa de chocolate', precio: 1000 },
        { nombre: 'Crema batida', precio: 1000 },
      ],
    },
  },

  {
    id: 6,
    nombre: 'Cheesecake',
    categoria: 'Postres',
    precio: 7000,
    descripcion:
      'Cheesecake cremoso estilo Nueva York con base de galleta. Disponible con salsa de frutos rojos o caramelo.',
    imagen: 'https://stateofdinner.com/wp-content/uploads/2023/03/philadelphia-cheesecake-featured.jpg',
    personalizacion: {
      tamanos: [{ nombre: 'Porción', precio: 0 }],
      leches: [],
      extras: [
        { nombre: 'Salsa de frutos rojos', precio: 1500 },
        { nombre: 'Salsa de caramelo', precio: 1500 },
        { nombre: 'Salsa de chocolate', precio: 1500 },
        { nombre: 'Crema batida', precio: 1000 },
      ],
    },
  },

  {
    id: 7,
    nombre: 'Tiramisú',
    categoria: 'Postres',
    precio: 7500,
    descripcion:
      'Postre italiano clásico con capas de bizcocho empapado en café, crema de mascarpone y cacao en polvo.',
    imagen:
      'https://imgs.search.brave.com/NxUtPfMC2t_pxJXgWJfpO8vs3WM4GiLoiqow_gHJjqQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTEz/NjQ2NTIxMy9lcy9m/b3RvL3RpcmFtaXMl/QzMlQkEuanBnP3M9/NjEyNjEyJnc9MCZr/PTIwJmM9Qk1TbGhm/ZklJamFtVVQ2RWNT/RW14Mi1mbWs4VWNE/SXluTFlXVTdRR2Zq/X1U9',
    personalizacion: {
      tamanos: [{ nombre: 'Porción', precio: 0 }],
      leches: [],
      extras: [
        { nombre: 'Cacao extra', precio: 500 },
        { nombre: 'Crema batida', precio: 1000 },
      ],
    },
  },

  // ━━━━ CATEGORÍA: SNACKS ━━━━
  {
    id: 8,
    nombre: 'Sándwich Club',
    categoria: 'Snacks',
    precio: 10000,
    descripcion:
      'Sándwich triple con pollo, tocino, lechuga, tomate y mayonesa. Servido con papas fritas.',
    imagen:
      'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2012/2/24/0/ZB0202H_classic-american-grilled-cheese_s4x3.jpg.rend.hgtvcom.826.620.suffix/1371603614279.jpeg',
    personalizacion: {
      tamanos: [{ nombre: 'Regular', precio: 0 }],
      leches: [],
      extras: [
        { nombre: 'Queso extra', precio: 1500 },
        { nombre: 'Tocino extra', precio: 2000 },
        { nombre: 'Aguacate', precio: 2500 },
        { nombre: 'Papas grandes', precio: 2000 },
      ],
    },
  },

  {
    id: 9,
    nombre: 'Croissant',
    categoria: 'Snacks',
    precio: 5500,
    descripcion:
      'Croissant francés recién horneado, hojaldrado y mantecoso. Disponible simple o relleno.',
    imagen:
      'https://imgs.search.brave.com/8a8ob_GAkfNTDSc3FzBaIG07d7E3aYaV1YYE9PypAnc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/dGhlZmxhdm9yYmVu/ZGVyLmNvbS93cC1j/b250ZW50L3VwbG9h/ZHMvMjAyMC8wNS9G/cmVuY2gtQ3JvaXNz/YW50cy1TTS0yMzYz/LmpwZw',
    personalizacion: {
      tamanos: [{ nombre: 'Simple', precio: 0 }],
      leches: [],
      extras: [
        { nombre: 'Relleno de jamón y queso', precio: 2500 },
        { nombre: 'Relleno de chocolate', precio: 2000 },
        { nombre: 'Relleno de almendra', precio: 2000 },
        { nombre: 'Mantequilla', precio: 500 },
      ],
    },
  },

  {
    id: 10,
    nombre: 'Bagel',
    categoria: 'Snacks',
    precio: 6500,
    descripcion:
      'Bagel artesanal tostado con queso crema. Opciones de salmón ahumado, vegetales o jamón.',
    imagen:
      'https://imgs.search.brave.com/F0XUm89vIw9zgDwQOabBUE555jm0fOQRPmwWA1G6Nfk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvNjI1/MDQ4ODA2L3Bob3Rv/L2JhZ2Vscy5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9ZG9p/YzNqN1JxT09GLUxU/QktKZU8yaHhKOVRx/LTZpVDFxMFNmeUky/SUNLbz0',
    personalizacion: {
      tamanos: [{ nombre: 'Regular', precio: 0 }],
      leches: [],
      extras: [
        { nombre: 'Salmón ahumado', precio: 4000 },
        { nombre: 'Jamón', precio: 2500 },
        { nombre: 'Aguacate', precio: 2500 },
        { nombre: 'Queso crema extra', precio: 1000 },
        { nombre: 'Tomate y cebolla', precio: 1000 },
      ],
    },
  },
];

/** Devuelve el array completo de productos */
export const obtenerTodosLosProductos = () => productosData;

/** Filtra productos por categoría específica */
export const obtenerProductosPorCategoria = (categoria) =>
  productosData.filter((producto) => producto.categoria === categoria);

/** Busca un producto por su ID (devuelve undefined si no existe) */
export const obtenerProductoPorId = (id) =>
  productosData.find((producto) => producto.id === id);

/** Obtiene lista única de categorías */
export const obtenerCategorias = () => [
  ...new Set(productosData.map((producto) => producto.categoria)),
];
