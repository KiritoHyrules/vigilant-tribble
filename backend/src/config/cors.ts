/** Esquema, host y puerto opcional; nada de rutas, consulta, fragmento, credenciales ni comodines. */
const ORIGIN_SHAPE = /^https?:\/\/[^/\\?#@*%\s]+$/i;

/**
 * Convierte CORS_ORIGINS (separado por comas) en la lista validada.
 * Vacío significa sin CORS. Cualquier entrada inválida lanza un error.
 */
export function parseCorsOrigins(value: string): string[] {
  if (value.trim() === '') return [];
  return value.split(',').map((entry) => {
    const origin = entry.trim();
    if (!ORIGIN_SHAPE.test(origin) || !URL.canParse(origin)) {
      // Sin repetir el valor: podría contener credenciales.
      throw new Error(
        'CORS_ORIGINS solo admite orígenes HTTP(S) explícitos, como https://app.ejemplo.pe',
      );
    }
    // Forma canónica, igual a la cabecera Origin del navegador.
    return new URL(origin).origin;
  });
}
