/**
 * Genera un identificador único para el formulario con el formato:
 * LUXEINSP-INICIALES-XXXX
 * donde INICIALES son las iniciales del nombre del invitado
 * y XXXX es un número aleatorio de 4 dígitos
 */
export function generateFormId(guestName: string): string {
  // Obtener iniciales del nombre del invitado
  const initials = guestName
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();

  // Generar número aleatorio de 4 dígitos
  const randomNum = Math.floor(1000 + Math.random() * 9000);

  // Construir el ID
  return `LUXEINSP-${initials}-${randomNum}`;
}
