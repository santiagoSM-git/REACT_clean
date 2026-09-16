/**
 * KAFFA - Capa centralizada de notificaciones (toasts).
 *
 * Envuelve la librería `sonner` para que los flujos nuevos (recuperar
 * contraseña, verificación de correo, etc.) notifiquen al usuario sin
 * depender del alert() nativo del navegador.
 *
 * Uso:
 *   import { toastSuccess, toastError } from '../lib/toast';
 *   toastSuccess('Correo enviado');
 *   toastError('Token inválido');
 */
import { toast } from 'sonner';

/** Notificación de éxito (verde). */
export function toastSuccess(mensaje) {
  toast.success(mensaje);
}

/** Notificación de error (rojo). */
export function toastError(mensaje) {
  toast.error(mensaje);
}

/** Notificación informativa (neutra). */
export function toastInfo(mensaje) {
  toast(mensaje);
}
