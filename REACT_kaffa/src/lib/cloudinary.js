/**
 * KAFFA - Integración con Cloudinary (subida "unsigned" desde el navegador).
 *
 * Buenas prácticas aplicadas:
 *  - La subida va directa del navegador a Cloudinary (no pasa por nuestro
 *    backend), usando un upload preset *unsigned*: nunca se expone el API secret.
 *  - El backend sólo recibe y valida la URL resultante (`secure_url`), que es la
 *    que se persiste en la base de datos.
 *  - La carpeta destino (`samples/ecommerce`) la define el propio preset en
 *    Cloudinary; la petición unsigned sólo envía `file` + `upload_preset`.
 *  - El render de imágenes usa transformaciones de entrega (`f_auto,q_auto,w_`)
 *    para servir el formato/calidad óptimos.
 *
 * Variables de entorno (Vite, ver `.env.example`):
 *  - VITE_CLOUDINARY_CLOUD_NAME     (por defecto: roffd6et)
 *  - VITE_CLOUDINARY_UPLOAD_PRESET  (por defecto: KAFFACCYS)
 */
import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'roffd6et';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'KAFFACCYS';

// Instancia separada SIN el interceptor de apiClient: el token Bearer de
// KAFFA nunca debe viajar a Cloudinary.
const cloudinaryClient = axios.create({
  baseURL: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`,
});

/** Tamaño máximo aceptado en cliente (5 MB, igual que el backend). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

/** Identificadores públicos de la cuenta. */
export const CLOUDINARY = Object.freeze({
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
});

/** ¿Es una URL de entrega de Cloudinary? */
export function isCloudinary(url) {
  return typeof url === 'string' && /res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url);
}

/**
 * Construye una URL de entrega optimizada de Cloudinary.
 *
 * Acepta tanto un `public_id` "pelado" como una URL completa de Cloudinary.
 * Si la entrada no es de Cloudinary (p. ej. un asset externo) se devuelve sin
 * cambios, de modo que nunca rompe imágenes heredadas.
 *
 * @param {string} src  public_id o secure_url
 * @param {{w?:number,h?:number,crop?:string,gravity?:string,q?:string|number,f?:string|boolean}} [opts]
 * @returns {string}
 */
export function cloudinaryUrl(src, opts = {}) {
  if (!src || typeof src !== 'string') return src;

  const { w, h, crop = 'fill', gravity, q = 'auto', f = 'auto' } = opts;

  const hasWidth = Number(w) > 0;
  const hasHeight = Number(h) > 0;

  const params = [];
  if (hasWidth) params.push(`w_${Math.round(Number(w))}`);
  if (hasHeight) params.push(`h_${Math.round(Number(h))}`);
  if (hasWidth || hasHeight) params.push(`c_${crop}`);
  if (gravity) params.push(`g_${gravity}`);
  if (f) params.push(`f_${f}`);
  if (q) params.push(`q_${q}`);
  const tf = params.join(',');

  if (/^https?:\/\//i.test(src)) {
    if (!isCloudinary(src) || !tf) return src;
    return src.replace('/image/upload/', `/image/upload/${tf}/`);
  }

  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  return tf ? `${base}/${tf}/${src}` : `${base}/${src}`;
}

/**
 * Sube una imagen a Cloudinary con el preset unsigned.
 *
 * @param {File} file
 * @param {{onProgress?:(pct:number)=>void, signal?:AbortSignal}} [opts]
 * @returns {Promise<{url:string, secureUrl:string, publicId:string, width:number, height:number, format:string, bytes:number}>}
 */
export async function uploadImage(file, { onProgress, signal } = {}) {
  if (!file) throw new Error('No se seleccionó ninguna imagen.');

  if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG, WebP o AVIF.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen supera el máximo permitido (5 MB).');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);

  try {
    const { data } = await cloudinaryClient.post('/image/upload', form, {
      signal,
      onUploadProgress: (event) => {
        if (event.total && typeof onProgress === 'function') {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });

    if (!data?.secure_url) {
      throw new Error('Cloudinary no devolvió una URL válida.');
    }

    return {
      url: data.secure_url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new Error('Subida cancelada.', { cause: error });
    }

    throw new Error(
      error.response?.data?.error?.message ||
        error.message ||
        `Cloudinary respondió con error ${error.response?.status ?? 'desconocido'}.`,
      { cause: error },
    );
  }
}

export default { uploadImage, cloudinaryUrl, isCloudinary, CLOUDINARY, MAX_IMAGE_BYTES };
